import { FlatList, StyleSheet, Text, View } from 'react-native'
import React, { useEffect } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import SearchInput from '../../components/SearchInput'
import EmptyState from '../../components/EmptyState'
import { searchPosts } from '../../service/appwrite'
import useAppwrite from '../../service/useAppwrite'
import VideoCard from '../../components/VideoCard'
import { useLocalSearchParams } from 'expo-router'

const Search = () => {
  const { query } = useLocalSearchParams()
  const { data: posts, refetch } = useAppwrite(() => searchPosts(query))
// console.log(posts)
  useEffect(() => {
    refetch()
  }, [query])


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
            time={item.$createdAt}
          />
        )}
        ListHeaderComponent={() => (
          <View className="my-6 px-4 ">
            <Text className="font-pmedium text-sm text-gray-100">
              Search Results
            </Text>
            <Text className="text-2xl font-psemibold text-white">
              {query}
            </Text>
            <View className="mt-6 mb-8">
              <SearchInput initialQuery={query} />
            </View>
          </View>
        )}
        ListEmptyComponent={() => (
          <EmptyState
            title="Không tìm thấy ảnh/video nào"
            subtitle="Không có ảnh/video cho tìm kiếm này"
          />
        )}

      />
    </SafeAreaView>
  )
}

export default Search

const styles = StyleSheet.create({})
