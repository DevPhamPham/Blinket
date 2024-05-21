import { View, Text, Image, TouchableOpacity, Alert, TouchableWithoutFeedback } from 'react-native';
import React, { useState } from 'react';
import { icons } from '../constants';
import { Video, ResizeMode } from 'expo-av';
import { deletePost } from '../service/appwrite';

const VideoCard = ({ title, creator, avatar, thumbnail, video, fromUser, docId, time, onDeleteImageChange }) => {
  const [play, setPlay] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [deleteImage, setDeleteImage] = useState(false);

  const handleMenuPress = () => {
    setShowMenu(!showMenu);
  };

  const handleCloseMenu = () => {
    setShowMenu(false);
  };

  const deletePostSelect = async () => {
    try {
      await deletePost({
        docId: docId,
      });

      Alert.alert("Success", "Đã xóa thành công", setDeleteImage(true));
      onDeleteImageChange(true);
    } catch (error) {
      Alert.alert("Lỗi", error.message);
    }
  };

  return deleteImage ? null : (
    <TouchableWithoutFeedback onPress={handleCloseMenu}>
      <View className="flex flex-col items-center px-4 mb-14">
        <View className="flex flex-row gap-3 items-start">
          <View className="flex justify-center items-center flex-row flex-1">
            <View className="w-[46px] h-[46px] rounded-lg border border-secondary flex justify-center items-center p-0.5">
              <Image
                source={{ uri: avatar }}
                className="w-full h-full rounded-lg"
                resizeMode="cover"
              />
            </View>

            <View className="flex justify-center flex-1 ml-3 gap-y-1">
              <Text className="font-psemibold text-sm text-white" numberOfLines={1}>
                {creator}
              </Text>

              <Text className="text-xs text-gray-100 font-pregular" numberOfLines={1}>
                {time.split('T')[0]}
              </Text>
            </View>
          </View>
          {fromUser ? (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleMenuPress}
              className="pt-2"
            >
              <Image source={icons.menu} className="w-5 h-5" resizeMode="contain" />
              {showMenu ? (
                <View className="absolute right-10 bottom-5 bg-white rounded w-20 shadow-lg">
                  <TouchableOpacity
                    onPress={deletePostSelect}
                    className="flex items-center justify-center py-2"
                  >
                    <Text className="text-primary font-psemibold">Delete</Text>
                  </TouchableOpacity>
                </View>
              ) : null}
            </TouchableOpacity>
          ) : null}
        </View>

        <View className="mt-1">
            <Text className="font-psemibold text-sm text-white" numberOfLines={2}>
              {title}
            </Text>
          </View>

        {play ? (
          <Video
            source={{ uri: video }}
            className="w-full h-60 rounded-xl"
            resizeMode={ResizeMode.CONTAIN}
            useNativeControls
            shouldPlay
            isLooping
            onPlaybackStatusUpdate={(status) => {
              if (status.didJustFinish) {
                setPlay(false);
              }
            }}
          />
        ) : (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setPlay(true)}
            className="w-full h-60 rounded-xl relative flex justify-center items-center"
          >
            <Image
              source={{ uri: thumbnail }}
              className="w-full h-full rounded-xl mt-3"
              resizeMode="cover"
            />
            <Image
              source={icons.play}
              className="w-12 h-12 absolute"
              resizeMode="contain"
            />
          </TouchableOpacity>
        )}
      </View>
    </TouchableWithoutFeedback>
  );
};

export default VideoCard;
