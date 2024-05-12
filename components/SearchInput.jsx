import { TextInput, View, TouchableOpacity, Image, Alert } from 'react-native';
import React, { useState } from 'react';
import { icons } from '../constants';
import { usePathname, router } from 'expo-router';

const SearchInput = ({ initialQuery }) => {
  const pathname = usePathname();
  const [query, setQuery] = useState(initialQuery || '');

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      search();
    }
  };

  const search = () => {
    if (query === '') {
      return Alert.alert(
        'Missing Query',
        'Please input something to search results across database'
      );
    }

    if (pathname.startsWith('/search')) router.setParams({ query });
    else router.push(`/search/${query}`);
  };

  return (
    <View className="border-2 border-black-200 w-full h-16 px-4 b-black-100 rounded-2xl focus:border-secondary items-center flex-row space-x-4">
      <TextInput
        className="text-base mt-0.5 text-white flex-1 font-pregular"
        value={query}
        placeholder="Tìm kiếm một chủ đề nào đó"
        placeholderTextColor="#CDCDE0"
        onChangeText={(text) => setQuery(text)}
        onKeyPress={handleKeyPress} // Xử lý sự kiện khi người dùng ấn phím
        returnKeyType="search" // Đặt loại nút khi ấn vào là Search
        onSubmitEditing={search} // Xử lý tìm kiếm khi ấn nút Search trên bàn phím
      />

      <TouchableOpacity onPress={search}>
        <Image source={icons.search} className="w-5 h-5" resizeMode="contain" />
      </TouchableOpacity>
    </View>
  );
};

export default SearchInput;
