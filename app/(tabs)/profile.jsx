import { FlatList, StyleSheet, Text, TouchableOpacity, RefreshControl, View, Image } from 'react-native'
import React, { useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import EmptyState from '../../components/EmptyState'
import { getUserPosts, signOut } from '../../service/appwrite'
import useAppwrite from '../../service/useAppwrite'
import VideoCard from '../../components/VideoCard'
import { useGlobalContext } from '../../context/GlobalProvider'
import { icons } from '../../constants'
import InfoBox from '../../components/InfoBox'
import { router } from 'expo-router'
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

const Profile = () => {
  const { setIsLogged, user, setUser } = useGlobalContext()
  const { data: posts, refetch } = useAppwrite(() => getUserPosts(user.$id))
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleDeleteImageChange = (value) => {
    if (value) onRefresh();
  };



  const logout = async () => {
    await signOut();
    setUser(null);
    setIsLogged(false);

    router.replace("/sign-in");
  };

  return (
    <SafeAreaView className="bg-black-100 h-full">
      <FlatList
        data={posts}
        keyExtractor={(item) => item.$id}
        renderItem={({ item }) => (
          <VideoCard
            title={item.title}
            thumbnail={item.thumbnail}
            video={item.video}
            creator={item.creator.username}
            avatar={item.creator.avatar}
            fromUser={true}
            docId={item.$id}
            time={item.$createdAt}
            onDeleteImageChange={handleDeleteImageChange}
          />
        )}
        ListHeaderComponent={() => (
          <View className="w-full flex justify-center items-center mt-6 mb-12 px-4">

            <View className="mt-5 w-20 h-20 border border-secondary rounded-[46px] flex justify-center items-center">
              <Image
                source={{ uri: user?.avatar }}
                className="w-[90%] h-[90%] rounded-[46px]"
                resizeMode="cover"
              />
            </View>

            <InfoBox
              title={user?.username}
              containerStyles="mt-5"
              titleStyles="text-lg"
            />

            <View className="mt-5 flex flex-row">
              <InfoBox
                title={posts.length || 0}
                subtitle="Bài đăng"
                titleStyles="text-xl"
                containerStyles="mr-10"
              />
              <InfoBox
                title="0"
                subtitle="Bạn bè"
                titleStyles="text-xl"
              />
            </View>

            <View className="w-full mt-5 flex flex-row">
              <View className="flex flex-row">
                <MaterialIcons name={"error"} size={28} color="grey" />
                <InfoBox
                  title="Vùng nguy hiểm"
                  titleStyles="text-lg font-pregular"
                  containerStyles="mr-10"
                />
              </View>
            </View>


            <TouchableOpacity
              onPress={logout}
              className="flex w-full items-start"
            >
              <Image
                source={icons.logout}
                resizeMode="contain"
                className="w-6 h-6"
              />
            </TouchableOpacity>

          </View>
        )}
        ListEmptyComponent={() => (
          <EmptyState
            title="Không tìm thấy ảnh/video nào"
            subtitle="Không có ảnh/video cho tìm kiếm này"
          />
        )}

        refreshControl={<RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
        />}
      />
    </SafeAreaView>
  )
}

export default Profile

const styles = StyleSheet.create({})
