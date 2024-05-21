import { Image, StyleSheet, Platform, ScrollView, Pressable, View, Text, FlatList, Dimensions } from 'react-native';

import { HelloWave } from '@/components/HelloWave';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useEffect, useState } from 'react';
import { useIsFocused } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Product } from '@/types/Product';
import CardProduct from '@/components/CardProduct';
import * as Haptics from 'expo-haptics';

export default function HomeScreen() {
    const [data, setData] = useState([] as Product[]);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedFilters, setSelectedFilters] = useState([] as any[]);
    const [expiredDateDifference, setExpiredDateDifference] = useState(null);

    const isFocused = useIsFocused();

    useEffect(() => {
        refreshProducts();
    }, [isFocused]);

    const refreshProducts = async () => {
        try {
            let _items = await AsyncStorage.getItem('@expiredproducts_products');
            if (_items == null) {
                _items = '[]';
            }
            let items: Product[] = JSON.parse(_items);

            items.forEach((item, key) => {
                const expiredDate = new Date(item.date?.year, item.date?.month - 1, item.date?.day);
                const today = new Date();

                const expiredDateDifference = Math.round((expiredDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

                switch (true) {
                    case expiredDateDifference == null:
                        items[key].options = {
                            color: 'primary',
                            content: '-'
                        };
                        break;

                    case expiredDateDifference > 15:
                        items[key].options = {
                            color: 'ok',
                            content: expiredDateDifference + ' jours'
                        };
                        break;

                    case expiredDateDifference > 5:
                        items[key].options = {
                            color: 'info',
                            content: expiredDateDifference + ' jours'
                        };
                        break;

                    case expiredDateDifference >= 0:
                        items[key].options = {
                            color: 'danger',
                            content: expiredDateDifference + ' jours'
                        };
                        break;

                    case expiredDateDifference < 0:
                        items[key].options = {
                            color: 'none',
                            content: 'Périmé'
                        };
                        break;
                }
            });

            if (selectedFilters.length > 0) {
                items = items.filter((item) => {
                    const corr = ['none', 'danger', 'info', 'ok'];
                    var result = false;
                    selectedFilters.forEach((filter) => {
                        if (item.options?.color == corr[filter]) {
                            result = true;
                        }
                    });

                    return result;
                });
            }

            items = items.sort((a, b) => {
                return a.date?.day - b.date?.day;
            });
            items = items.sort((a, b) => {
                return a.date?.month - b.date?.month;
            });
            items = items.sort((a, b) => {
                return a.date?.year - b.date?.year;
            });

            setData(items);
            setRefreshing(false);
        } catch (e) {
            console.log(e);
        }
    }

    useEffect(() => {
        refreshProducts();
    }, [selectedFilters, expiredDateDifference]);

    const onRefresh = () => {
        refreshProducts();
    };

    const toggleFilter = (filterId: any) => {
        Haptics.selectionAsync();
        if (indexOfFilter(filterId) === -1) {
            const _selectedFilters = [...selectedFilters, filterId];
            setSelectedFilters(_selectedFilters);
        } else {
            if (selectedFilters.length > 1) {
                setSelectedFilters(selectedFilters.filter(item => item !== filterId));
            } else {
                setSelectedFilters([]);
            }
        }
    };

    const indexOfFilter = (filterId: any) => {
        return selectedFilters.indexOf(filterId);
    };

    let generateRandomNum = () => Math.floor(Math.random() * Math.random() * 1001);

    return (
        <ParallaxScrollView
            headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
            header={(
                <ThemedView style={styles.titleContainer}>
                    <ThemedText type="title">Mes produits</ThemedText>
                    <HelloWave />
                </ThemedView>
            )}
        >
            <ScrollView
                style={{ flex: 1, paddingHorizontal: 20, width: Dimensions.get('window').width, left: -32 }}
                horizontal={true}
                showsHorizontalScrollIndicator={false}
            >
                <Pressable
                    style={[styles.filter, indexOfFilter(0) !== -1 ? styles.filter__selected : {}]}
                    onPress={() => { toggleFilter(0) }}
                >
                    <View style={[styles.filter_dot, styles.filter_dot__none]}><></></View>
                    <Text>Périmé</Text>
                </Pressable>
                <Pressable
                    style={[styles.filter, indexOfFilter(1) !== -1 ? styles.filter__selected : {}]}
                    onPress={() => { toggleFilter(1) }}
                >
                    <View style={[styles.filter_dot, styles.filter_dot__danger]}><></></View>
                    <Text>{'<'} 5 jours</Text>
                </Pressable>
                <Pressable
                    style={[styles.filter, indexOfFilter(2) !== -1 ? styles.filter__selected : {}]}
                    onPress={() => { toggleFilter(2) }}
                >
                    <View style={[styles.filter_dot, styles.filter_dot__info]}><></></View>
                    <Text>{'<'} 15 jours</Text>
                </Pressable>
                <Pressable
                    style={[styles.filter, indexOfFilter(3) !== -1 ? styles.filter__selected : {}]}
                    onPress={() => { toggleFilter(3) }}
                >
                    <View style={[styles.filter_dot, styles.filter_dot__ok]}><></></View>
                    <Text>{'>'} 15 jours</Text>
                </Pressable>
            </ScrollView>
            <FlatList
                renderItem={({ item }) => <CardProduct item={item} refreshProducts={refreshProducts} />}
                data={data}
                onRefresh={onRefresh}
                refreshing={refreshing}
                showsVerticalScrollIndicator={false}
                style={{ flex: 1, alignSelf: 'stretch', paddingTop: 20, paddingBottom: 20, overflow: 'visible' }}
                scrollEnabled={false}
            />
        </ParallaxScrollView>
    );
}

const styles = StyleSheet.create({
    titleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: 'transparent'
    },
    filter: {
        borderRadius: 100,
        borderColor: '#888',
        backgroundColor: '#fff',
        paddingHorizontal: 15,
        paddingVertical: 7,
        marginRight: 10,
        flexDirection: 'row',
        alignItems: 'center',
        height: 35
    },
    filter__selected: {
        transform: [{ scale: 0.8 }],
        backgroundColor: 'tomato'
    },
    filter_dot: {
        borderRadius: 100,
        width: 10,
        height: 10,
        marginRight: 7
    },
    filter_dot__ok: {
        backgroundColor: '#287D3C'
    },
    filter_dot__info: {
        backgroundColor: '#F19F47'
    },
    filter_dot__danger: {
        backgroundColor: '#DA1414'
    },
    filter_dot__none: {
        backgroundColor: '#000'
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
});
