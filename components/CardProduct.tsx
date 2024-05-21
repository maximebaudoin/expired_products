import React, { useState, useEffect, useRef } from 'react';
import { Animated, StyleSheet, View, Text, Pressable, Image, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Product } from '@/types/Product';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

const CardProduct = ({ item, refreshProducts }: {
    item: Product,
    refreshProducts: Function
}) => {

    const rotateAnim = useRef(new Animated.Value(0)).current;
    const opacity = useRef(new Animated.Value(0)).current;
    const height = useRef(new Animated.Value(0)).current;
    const [rotated, setRotated] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);

    const rotateValue = rotateAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['-180deg', '0deg']
    });

    const maxHeight = height.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 1000]
    });

    const rotate = () => {
        Haptics.selectionAsync();
        if (rotated) {
            Animated.timing(rotateAnim, {
                toValue: 0,
                duration: 250,
                useNativeDriver: true
            }).start();
            Animated.timing(height, {
                toValue: 0,
                duration: 400,
                useNativeDriver: false
            }).start();
            Animated.timing(opacity, {
                toValue: 0,
                duration: 250,
                useNativeDriver: false
            }).start();
            setRotated(false);
        } else {
            Animated.timing(rotateAnim, {
                toValue: 1,
                duration: 250,
                useNativeDriver: true
            }).start();
            Animated.timing(height, {
                toValue: 1,
                duration: 500,
                useNativeDriver: false
            }).start();
            Animated.timing(opacity, {
                toValue: 1,
                duration: 250,
                useNativeDriver: false
            }).start();
            setRotated(true);
        }
    }

    const colorCaptcher = (colorName: string | undefined) => {
        switch (colorName) {
            case 'primary':
                return '#888';
                break;
            case 'ok':
                return '#287D3C';
                break;
            case 'info':
                return '#F19F47';
                break;
            case 'danger':
                return '#DA1414';
                break;
            case 'none':
            default:
                return '#000';
                break;
        }
    }

    return (
        <Pressable onPress={() => rotate()} style={styles.container}>
            <View style={{ flexDirection: 'row', padding: 15 }}>
                <Image source={{ uri: item.image_front_url }} resizeMode="contain" style={styles.imageSmall} />
                <View style={styles.bodyTexts}>
                    <Text style={styles.name}>
                        {item.name}
                    </Text>
                    <Text style={styles.manufacter}>
                        {item.brands}
                    </Text>
                </View>
                <Animated.View
                    style={[{ transform: [{ rotate: rotateValue }] }, { alignSelf: 'center' }]}
                >
                    <Ionicons name="chevron-up" size={20} />
                </Animated.View>

                <View
                    style={[styles.expiredDate, {
                        backgroundColor: colorCaptcher(item.options?.color)
                    }]}
                >
                    <Text style={styles.expiredDate__text}>
                        {item.options?.content}
                    </Text>
                </View>
            </View>
            <Animated.View style={[{ opacity: opacity, maxHeight: maxHeight }]}>
                <View style={{ paddingBottom: 15, paddingTop: 5 }}>
                    <Text>{item.ean}</Text>
                    <Text>{item.date?.day.toLocaleString('fr-FR', { minimumIntegerDigits: 2 })}/{item.date?.month.toLocaleString('fr-FR', { minimumIntegerDigits: 2 })}/{item.date?.year}</Text>
                    <TouchableOpacity
                        style={styles.expiredDate__btnDelete}
                        onPress={async () => {
                            let storedProducts = [];
                            let products = await AsyncStorage.getItem('@expiredproducts_products');
                            if (products !== null) {
                                storedProducts = JSON.parse(products);
                            }

                            storedProducts = storedProducts.filter(function (obj: Product) {
                                return obj._id !== item._id;
                            });

                            await AsyncStorage.setItem('@expiredproducts_products', JSON.stringify(storedProducts));
                            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

                            refreshProducts();
                        }}
                    >
                        <Text style={styles.expiredDate__btnDelete_text}>Supprimer</Text>
                    </TouchableOpacity>
                </View>
            </Animated.View>
        </Pressable>
    );
}

export default CardProduct;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignSelf: 'stretch',
        marginBottom: 20,
        borderRadius: 20,
        alignItems: 'center',
        backgroundColor: '#fff',
        flexDirection: 'column',
        position: 'relative'
    },
    imageSmall: {
        width: 75,
        height: 75,
        // borderWidth: 1,
        // borderColor: '#000'
    },
    bodyTexts: {
        alignSelf: 'stretch',
        flex: 1,
        paddingLeft: 20
    },
    expiredDate: {
        textAlign: 'left',
        paddingVertical: 7,
        paddingHorizontal: 13,
        alignSelf: 'baseline',
        position: 'absolute',
        top: -10,
        right: -5,
        borderRadius: 100,
    },
    expiredDate__text: {
        fontSize: 14,
        color: '#fff',
    },
    name: {
        fontSize: 18,
        marginTop: 10,
        marginBottom: 5,
        textAlign: 'left'
    },
    manufacter: {
        fontSize: 14,
        fontStyle: 'italic',
        color: '#888',
        textAlign: 'left'
    },
    btn: {
        width: '100%',
        alignItems: 'center',
        padding: 15,
        borderRadius: 100,
        margin: 5,
    },
    btnPrimary: {
        backgroundColor: '#2f95dc'
    },
    btnSecondary: {
        backgroundColor: '#ccc'
    },
    text: {
    },
    expiredDate__btnDelete: {
        marginTop: 10
    },
    expiredDate__btnDelete_text: {
        color: '#ff0000',
        fontWeight: "bold"
    }
});