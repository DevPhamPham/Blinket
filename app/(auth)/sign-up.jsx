import { ScrollView, Text, View, Image, Alert } from 'react-native'
import React, { useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'

import { images } from '../../constants'

import FormField from '../../components/FormField'
import CustomButton from '../../components/CustomButton'
import { Link, router } from 'expo-router'
import { createUser } from '../../service/appwrite'
import { useGlobalContext } from '../../context/GlobalProvider'


const SignUp = () => {
  const { setUser, setIsLogged } = useGlobalContext()
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const submit = async () => {
    if (form.username === "" || form.email === "" || form.password === "") {
      Alert.alert('Error', 'Vui lòng nhập đầy đủ')
    }

    setIsSubmitting(true);
    try {
      const result = await createUser(form.email, form.password, form.username)

      setUser(result)
      setIsLogged(true)

      router.replace('/home')
    } catch (error) {
      Alert.alert('Error', error.message)
    } finally {
      setIsSubmitting(false);
    }
  }


  return (
    <SafeAreaView className="bg-black h-full">
      <ScrollView>
        <View className="w-full justify-center min-h-[83vh] px-4 my-6">
          <Image
            source={images.blinket_logo}
            resizeMode='contain'
            className="w-[115px] h-[50px]"
          />

          <Text className="text-2xl text-white text-semiboldb mt-10 font-psemibold">
            Đăng ký Blinket
          </Text>

          <FormField
            title="Username"
            value={form.username}
            handleChangeText={(e) => setForm({ ...form, username: e })}
            otherStyles="mt-10"
          />

          <FormField
            title="Email"
            value={form.email}
            handleChangeText={(e) => setForm({ ...form, email: e })}
            otherStyles="mt-7"
            keyboardType="email-address"
          />

          <FormField
            title="Password"
            value={form.password}
            handleChangeText={(e) => setForm({ ...form, password: e })}
            otherStyles="mt-7"
          />

          <CustomButton
            title="Đăng ký"
            handlePress={submit}
            containerStyles="mt-7 bg-primary-300"
            isLoading={isSubmitting}
          />

          <View className="justify-center pt-5 flex-row gap-2">
            <Text className="text-lg text-gray-100 font-pregular">
              Bạn đã có tài khoản?
            </Text>
            <Link href="/sign-in" className="text-lg font-pmedium text-primary-300">Đăng nhập</Link>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

export default SignUp


