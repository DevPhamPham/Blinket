import { StatusBar } from 'expo-status-bar';
// import React from 'react';
import { Image, ScrollView, Text, View } from 'react-native';
import { Redirect, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { images } from "../constants"
import CustomButton from '../components/CustomButton';
import { useGlobalContext } from '../context/GlobalProvider';

export default function App() {
  const {loading, isLogged} = useGlobalContext();

  if(!loading && isLogged) return <Redirect href="/home"/>

  return (
    <SafeAreaView className="bg-black-100 h-full">
      <ScrollView contentContainerStyle={{ height: '100%' }}>
        <View className="w-full items-center justify-center min-h-[85vh] px-4">
          <Image
            source={images.blinket_logo}
            className="w-[200px]"
            resizeMode="contain"
          />

          <Image
            source={images.cards}
            className="max-w-[380px] w-full h-[300px]"
            resizeMode="contain"
          />
          <View className="relative mt-5">
            <Text className="text-3xl font-bold text-center text-white">Khám phá khả năng vô tận với {' '}
              <Text className="text-primary-200">Blinket</Text>
            </Text>

            <Image
              source={images.path}
              className="w-[136px] h-[15px] absolute -bottom-0 -right-0 rotate-180"
              resizeMode="contain"
            />
          </View>

          <Text className="text-gray-100 mt-7 text-center text-sm font-pregular">
            Nơi chia sẻ những khoảng khắc: bắt
            tay vào hành trình khám phá Blinket
          </Text>

          <CustomButton 
            title="Bắt đầu với Email"
            handlePress={() => router.push('/sign-in')}
            containerStyles="w-full mt-7 bg-primary-300"
          />
        </View>
      </ScrollView>
      
      <StatusBar backgroundColor='#161622'
      style='light' 
      />

    </SafeAreaView>
  );
}
