import { StyleSheet, TouchableOpacity, ActivityIndicator, Image, Modal } from 'react-native';
import { useEffect, useState } from 'react';

import EditScreenInfo from '../components/EditScreenInfo';
import { Text, View } from '../components/Themed';

import { BarCodeScanner } from 'expo-barcode-scanner'; 
import axios from 'axios';
import { StatusBar } from 'expo-status-bar';

import Colors from '../constants/Colors';

export default function TabTwoScreen() {
    const [hasPermission, setHasPermission] = useState(null);
    const [scanned, setScanned] = useState(false);
    const [loaded, setLoaded] = useState(false);
    const [productData, setProductData] = useState({});

    useEffect(() => {
        (async () => {
            const { status } = await BarCodeScanner.requestPermissionsAsync();
            setHasPermission(status === 'granted');
        })();
    }, []);

    const handleBarCodeScanned = ({ type, data }) => {
        setScanned(true);
        setLoaded(false);
        setProductData({});
        console.log('go: '+data);
        
        axios.get('https://world.openfoodfacts.org/api/v0/product/'+data)
        .then((response) => {
            setTimeout(() => {
                setLoaded(true);
            }, 500);

            let product = JSON.parse(response.request.response).product;

            switch(true) {
                case product.abbreviated_product_name_fr !== "" && typeof product.abbreviated_product_name_fr !== "undefined":
                    setProductData({...product, name: product.abbreviated_product_name_fr});
                    break;
                case product.abbreviated_product_name !== "" && typeof product.abbreviated_product_name !== "undefined":
                    setProductData({...product, name: product.abbreviated_product_name});
                    break;
                case product.generic_name_fr !== "" && typeof product.generic_name_fr !== "undefined":
                    setProductData({...product, name: product.generic_name_fr});
                    break;
                case product.generic_name !== "" && typeof product.generic_name !== "undefined":
                    setProductData({...product, name: product.generic_name});
                    break;
                case product.product_name_fr !== "" && typeof product.product_name_fr !== "undefined":
                    setProductData({...product, name: product.product_name_fr});
                    break;
                case product.product_name !== "" && typeof product.product_name !== "undefined":
                    setProductData({...product, name: product.product_name});
                    break;
                default:
                    setProductData({...product, name: '-'});
                    break;
            }
        })
        .catch((err) => {
            console.log(err);
        });
    };

    if (hasPermission === null) {
        return <Text>Requesting for camera permission</Text>;
    }
    if (hasPermission === false) {
        return <Text>No access to camera</Text>;
    }

    return (
        <View style={styles.container}>
            <BarCodeScanner
                onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
                style={StyleSheet.absoluteFillObject}
            />
            { scanned && (
            <View
                style={styles.cardProductScanned}
            >
                { !loaded ? (
                    <>
                        <ActivityIndicator size="large"/>
                        <TouchableOpacity
                            onPress={() => setScanned(false)}
                            style={[styles.cardProductScanned_btn, styles.cardProductScanned_btnPrimary]}
                        >
                            <Text style={styles.cardProductScanned_text}>Ajouter</Text>
                        </TouchableOpacity>
                    </>
                ) : (
                    <>
                        <Image source={{uri: productData.image_front_url}} resizeMode="contain" style={styles.cardProductScanned_imageSmall} />
                        <Text style={styles.cardProductScanned_name}>
                            {productData.name}
                        </Text>
                        <Text style={styles.cardProductScanned_manufacter}>
                            {productData.brands}
                        </Text>
                        <TouchableOpacity
                            onPress={() => setScanned(false)}
                            style={[styles.cardProductScanned_btn, styles.cardProductScanned_btnPrimary]}
                        >
                            <Text style={[styles.cardProductScanned_text, {fontWeight: 'bold', color: '#fff'}]}>Ajouter</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => setScanned(false)}
                            style={[styles.cardProductScanned_btn, styles.cardProductScanned_btnSecondary]}
                        >
                            <Text style={styles.cardProductScanned_text}>Retour</Text>
                        </TouchableOpacity>
                    </>
                )}
            </View>
            )}
            <StatusBar />
        </View>
    );
//   return (
//     <View style={styles.container}>
//       <Text style={styles.title}>Tab Two</Text>
//       <View style={styles.separator} lightColor="#eee" darkColor="rgba(255,255,255,0.1)" />
//       <EditScreenInfo path="/screens/TabTwoScreen.tsx" />
//     </View>
//   );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
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
        padding: 30,
        borderRadius: 20,
        margin: 35,
        alignItems: 'center'
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
        backgroundColor: Colors.light.tabIconSelected
    },
    cardProductScanned_btnSecondary: {
        backgroundColor: Colors.light.tabIconDefault
    },
    cardProductScanned_text: {
    }
});
