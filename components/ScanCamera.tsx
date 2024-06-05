import { Ionicons } from '@expo/vector-icons';
import { BarcodeScanningResult, CameraView, useCameraPermissions } from 'expo-camera';
import { CameraType } from 'expo-camera/build/legacy/Camera.types';
import { useState } from 'react';
import { ActivityIndicator, Button, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from '@react-native-picker/picker';
import { Product } from '@/types/Product';
import * as Haptics from 'expo-haptics';
import CryptoJS from 'crypto-js';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { formatISO, startOfDay } from 'date-fns';
import { utcToZonedTime } from 'date-fns-tz';

export function ScanCamera() {
    const [facing, setFacing] = useState(CameraType.back);
    const [permission, requestPermission] = useCameraPermissions();

    const [scanned, setScanned] = useState(false);
    const [foundProduct, setFoundProduct] = useState(false);
    const [productData, setProductData] = useState({} as Product);
    const [loaded, setLoaded] = useState(false);

    const [selectedDay, setSelectedDay] = useState(new Date().getDate());
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());


    if (!permission) {
        return <View />;
    }

    if (!permission.granted) {
        return (
            <View style={styles.container}>
                <Text style={{ textAlign: 'center' }}>Nous avons besoin de l'accès à votre caméra pour scanner vos produits</Text>
                <Button onPress={requestPermission} title="Autoriser l'accès à la caméra" />
            </View>
        );
    }

    function toggleCameraFacing() {
        setFacing(current => (current === CameraType.back ? CameraType.front : CameraType.back));
        Haptics.selectionAsync();
    }

    const handleScan = async ({ data }: BarcodeScanningResult) => {
        setScanned(true);
        setLoaded(false);
        setFoundProduct(false);
        setProductData({});
        setSelectedDay(new Date().getDate());
        setSelectedMonth(new Date().getMonth() + 1);
        setSelectedYear(new Date().getFullYear());

        Haptics.selectionAsync();

        await axios.get('https://world.openfoodfacts.org/api/v0/product/' + data)
            .then((response) => {
                let product = JSON.parse(response.request.response).product;

                if (typeof product == 'undefined') {
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                    setLoaded(true);
                    setFoundProduct(false);
                    return false;
                }

                setTimeout(() => {
                    setLoaded(true);
                    setFoundProduct(true);
                    Haptics.selectionAsync();
                }, 500);

                switch (true) {
                    case product.abbreviated_product_name_fr !== "" && typeof product.abbreviated_product_name_fr !== "undefined":
                        product.name = product.abbreviated_product_name_fr;
                        break;
                    case product.abbreviated_product_name !== "" && typeof product.abbreviated_product_name !== "undefined":
                        product.name = product.abbreviated_product_name;
                        break;
                    case product.generic_name_fr !== "" && typeof product.generic_name_fr !== "undefined":
                        product.name = product.generic_name_fr;
                        break;
                    case product.generic_name !== "" && typeof product.generic_name !== "undefined":
                        product.name = product.generic_name;
                        break;
                    case product.product_name_fr !== "" && typeof product.product_name_fr !== "undefined":
                        product.name = product.product_name_fr;
                        break;
                    case product.product_name !== "" && typeof product.product_name !== "undefined":
                        product.name = product.product_name;
                        break;
                    default:
                        product.name = '-';
                        break;
                }

                product = {
                    _id: product._id + '' + Date.now(),
                    ean: product._id,
                    name: product.name,
                    image_front_url: product.image_front_url,
                    brands: product.brands
                };

                setProductData(product);
            })
            .catch((err) => {
                console.log(err);
            });
    }

    const getNumberOfDays = (year: any, month: any) => {
        var isLeap = ((year % 4) == 0 && ((year % 100) != 0 || (year % 400) == 0));
        return [31, (isLeap ? 29 : 28), 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month];
    }

    const saveProduct = async () => {
        if (getNumberOfDays(selectedYear, selectedMonth) < selectedDay) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            return false;
        }

        try {
            let storedProducts = [];
            let products = await AsyncStorage.getItem('@expiredproducts_products');

            if (products !== null) {
                storedProducts = JSON.parse(products);
            }

            let _productData = { ...productData };
            _productData.date = {
                day: selectedDay,
                month: selectedMonth,
                year: selectedYear
            };
            storedProducts.push(_productData);

            const token = await Notifications.getExpoPushTokenAsync({
                projectId: Constants.expoConfig?.extra?.eas.projectId,
            });

            const expirationDate = new Date(_productData.date.year, _productData.date.month - 1, _productData.date.day);
            const parisTimeZone = 'Europe/Paris';
            const parisMidnight = startOfDay(utcToZonedTime(expirationDate, parisTimeZone));
            const expirationDateISO = formatISO(parisMidnight);

            const apiPayload = {
                product: {
                    name: productData.name,
                    thumbnailUrl: productData.image_front_url,
                    expirationDate: expirationDateISO
                },
                user: {
                    pushNotificationToken: token.data
                }
            }
            const payload = JSON.stringify(apiPayload);
            const secret = process.env.EXPO_PUBLIC_API_SECRET_KEY;
            const signature = CryptoJS.HmacSHA256(payload, secret).toString(CryptoJS.enc.Hex);

            await axios.post(`${process.env.EXPO_PUBLIC_API_URL}/product`, {
                ...apiPayload
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    'x-signature': signature
                }
            }).catch(e => console.log(e));

            await AsyncStorage.setItem('@expiredproducts_products', JSON.stringify(storedProducts));
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

            setScanned(false);
            setLoaded(false);
            setFoundProduct(false);
            setProductData({});
            setSelectedDay(1);
            setSelectedMonth(1);
            setSelectedYear(22);

        } catch (e) {
            // console.log(e);
        }
    }

    const days = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31];
    const months = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
    const years = [2023, 2024, 2025, 2026, 2027, 2028, 2029, 2030];

    const daysItems = days.map((prop, key) => {
        return <Picker.Item label={'' + prop + ''} value={prop} key={key} />
    });
    const monthsItems = months.map((prop, key) => {
        return <Picker.Item label={'' + prop + ''} value={prop} key={key} />
    });
    const yearsItems = years.map((prop, key) => {
        return <Picker.Item label={'' + prop + ''} value={prop} key={key} />
    });

    return (
        <View style={styles.container}>
            <CameraView style={[styles.camera, StyleSheet.absoluteFillObject]} facing={facing} barcodeScannerSettings={{
                barcodeTypes: ["ean13", "ean8"],
            }}
                onBarcodeScanned={scanned ? undefined : handleScan}>
                <View style={styles.buttonContainer}>
                    <TouchableOpacity style={styles.button} onPress={toggleCameraFacing}>
                        <Ionicons name='camera-reverse' color='#FFF' size={40} />
                    </TouchableOpacity>
                </View>
            </CameraView>
            {scanned && (
                <View
                    style={styles.cardProductScanned}
                >
                    {!loaded ? (
                        <>
                            <ActivityIndicator size="large" style={{ marginVertical: 20 }} />
                        </>
                    ) : (
                        foundProduct ? (
                            <>
                                <Image source={{ uri: productData.image_front_url }} resizeMode="contain" style={styles.cardProductScanned_imageSmall} />
                                <Text style={styles.cardProductScanned_name}>
                                    {productData.name}
                                </Text>
                                <Text style={styles.cardProductScanned_manufacter}>
                                    {productData.brands}
                                </Text>

                                <View style={{ flexDirection: 'row' }}>
                                    <Picker
                                        selectedValue={selectedDay}
                                        onValueChange={(itemValue, itemIndex) =>
                                            setSelectedDay(itemValue)
                                        }
                                        style={{ width: '30%' }}
                                    >
                                        {daysItems}
                                    </Picker>
                                    <Picker
                                        selectedValue={selectedMonth}
                                        onValueChange={(itemValue, itemIndex) =>
                                            setSelectedMonth(itemValue)
                                        }
                                        style={{ width: '30%' }}
                                    >
                                        {monthsItems}
                                    </Picker>
                                    <Picker
                                        selectedValue={selectedYear}
                                        onValueChange={(itemValue, itemIndex) =>
                                            setSelectedYear(itemValue)
                                        }
                                        style={{ width: '40%' }}
                                    >
                                        {yearsItems}
                                    </Picker>
                                </View>

                                <TouchableOpacity
                                    onPress={saveProduct}
                                    style={[styles.cardProductScanned_btn, styles.cardProductScanned_btnPrimary]}
                                >
                                    <Text style={[styles.cardProductScanned_text, { fontWeight: 'bold', color: '#fff' }]}>Ajouter</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={() => { setScanned(false);Haptics.selectionAsync(); }}
                                    style={[styles.cardProductScanned_btn, styles.cardProductScanned_btnSecondary]}
                                >
                                    <Text style={styles.cardProductScanned_text}>Retour</Text>
                                </TouchableOpacity>
                            </>
                        ) : (
                            <>
                                <Text style={styles.cardProductScanned_manufacter}>
                                    Produit inconnu
                                </Text>

                                <TouchableOpacity
                                    onPress={() => { setScanned(false);Haptics.selectionAsync(); }}
                                    style={[styles.cardProductScanned_btn, styles.cardProductScanned_btnSecondary]}
                                >
                                    <Text style={styles.cardProductScanned_text}>Retour</Text>
                                </TouchableOpacity>
                            </>
                        )
                    )}
                </View>
            )}
        </View>
    );
}


const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
    },
    camera: {
        flex: 1,
    },
    buttonContainer: {
        flex: 1,
        flexDirection: 'row',
        backgroundColor: 'transparent',
        margin: 64,
    },
    button: {
        flex: 1,
        alignSelf: 'flex-end',
        alignItems: 'center',
    },
    text: {
        fontSize: 24,
        fontWeight: 'bold',
        color: 'white',
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    separator: {
        marginVertical: 30,
        height: 1,
        width: '80%',
    },
    cardProductScanned: {
        alignSelf: 'stretch',
        padding: 20,
        borderRadius: 20,
        margin: 25,
        alignItems: 'center',
        backgroundColor: '#fff'
    },
    cardProductScanned_imageSmall: {
        width: '100%',
        height: 180
    },
    cardProductScanned_name: {
        fontSize: 22,
        marginTop: 20,
        marginBottom: 5,
        textAlign: 'center'
    },
    cardProductScanned_manufacter: {
        fontSize: 18,
        marginBottom: 20,
        fontStyle: 'italic',
        color: '#888',
        textAlign: 'center'
    },
    cardProductScanned_btn: {
        width: '100%',
        alignItems: 'center',
        padding: 15,
        borderRadius: 100,
        margin: 5,
    },
    cardProductScanned_btnPrimary: {
        backgroundColor: '#2f95dc'
    },
    cardProductScanned_btnSecondary: {
        backgroundColor: '#ccc'
    },
    cardProductScanned_text: {
    }
});