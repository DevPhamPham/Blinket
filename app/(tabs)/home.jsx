import { router } from "expo-router";

import FormField from "../../components/FormFieldUpload"
import { icons } from "../../constants";
import { createVideoPost, createImagePost } from "../../service/appwrite";

import { Camera } from 'expo-camera';
import React, { useState, useRef, useEffect } from 'react';
import { Button, ScrollView, StyleSheet, Text, TouchableOpacity, View, Image, Alert, SafeAreaView, useWindowDimensions, RefreshControl } from 'react-native';
import { Video, ResizeMode } from 'expo-av'
import { useIsFocused } from '@react-navigation/native';


import { shareAsync } from 'expo-sharing';
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system';

import { useGlobalContext } from "../../context/GlobalProvider";
import IconButton from "../../components/IconButton";
import CircleButton from "../../components/CircleButton";
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

const MAX_RECORDING_DURATION = 4; // Giới hạn thời gian quay 5 giây

const Home = () => {
  const { user } = useGlobalContext();
  const { width } = useWindowDimensions();
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    title: "",
    video: null,
    thumbnail: { "name": "test.jpg", "size": 120000, "type": "image/jpeg", "uri": "https://picsum.photos/400/300" }, //"https://picsum.photos/400/300"
    prompt: "My promt...",
  });
  const [uploadingImage, setUploadingImage] = useState(false);
  const [formImage, setFormImage] = useState({
    title: "",
    image: null
  });

  const submit = async () => {
    if (
      (form.prompt === "") |
      (form.title === "") |
      // !form.thumbnail |
      !form.video
    ) {
      return Alert.alert("Please provide all fields");
    }

    setUploading(true);
    try {
      await createVideoPost({
        ...form,
        userId: user.$id,
      });

      Alert.alert("Success", "Post uploaded successfully");
      reRecording();
      router.push("/explore");
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setForm({
        title: "",
        video: null,
        thumbnail: { "name": "thumbnail_random_picscum.jpg", "size": 174000, "type": "image/jpeg", "uri": "https://picsum.photos/400/300" },
        prompt: "My promt...",
      });

      setUploading(false);
    }
  };
  const submitImage = async () => {
    if (
      (formImage.title === "") |
      !formImage.image
    ) {
      return Alert.alert("Vui lòng nhập nội dung");
    }

    setUploadingImage(true);
    try {
      await createImagePost({
        ...formImage,
        userId: user.$id,
      });

      Alert.alert("Success", "Post uploaded successfully");
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setFormImage({
        title: "",
        video: null,
      });

      setUploadingImage(false);
      retakePicture();
      // router.push("/explore");
    }
  };

  const [facing, setFacing] = useState('back');
  const [flash, setFlash] = useState("off");

  const [capturedPhoto, setCapturedPhoto] = useState(null);
  const [isCapturing, setIsCapturing] = useState(false);

  const isFocused = useIsFocused();
  const cameraRef = useRef(null);
  const [cameraReady, setCameraReady] = useState(false);

  const [hasCameraPermission, setHasCameraPermission] = Camera.useCameraPermissions();
  const [hasMicrophonePermission, setHasMicrophonePermission] = Camera.useMicrophonePermissions();
  const [hasMediaLibraryPermission, requestPermission] = MediaLibrary.usePermissions();
  const [isRecording, setIsRecording] = useState(false);
  const [video, setVideo] = useState(null);
  const [albums, setAlbums] = useState(null);

  const [isLongPress, setIsLongPress] = useState(false);
  const pressTimeoutRef = useRef(null);

  const [refreshing, setRefreshing] = useState(false);


  useEffect(() => {
    let isMounted = true;

    const startCamera = async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      if (isMounted && status === 'granted') {
        setHasCameraPermission(true);
        setCameraReady(true); // Set to true when camera is ready
      }
    };

    if (isFocused) {
      startCamera();
    }

    return () => {
      isMounted = false;
      setCameraReady(false); // Reset when the tab is not focused
    };
  }, [isFocused]);


  if (!hasCameraPermission || !hasMicrophonePermission) {
    // Camera permissions are still loading
    return <View />;
  }

  if (!hasCameraPermission.granted) {
    // Camera permissions are not granted yet
    return (
      <View style={styles.container}>
        <Text style={{ textAlign: 'center' }}>We need your permission to show the camera</Text>
        <Button onPress={setHasCameraPermission} title="grant permission Camera" />
      </View>
    );
  }
  if (!hasMicrophonePermission.granted) {
    // Camera permissions are not granted yet
    return (
      <View style={styles.container}>
        <Text style={{ textAlign: 'center' }}>We need your permission to show the camera</Text>
        <Button onPress={setHasMicrophonePermission} title="grant permission Micro" />
      </View>
    );
  }

  const onRefresh = async () => {
    setRefreshing(true);
    await setHasCameraPermission();
    await setHasMicrophonePermission();
    setIsCapturing(false);
    setIsRecording(false);
    setVideo(null);
    setCapturedPhoto(null);
    setRefreshing(false);
  };

  async function getAlbums() {
    if (hasMediaLibraryPermission.status !== 'granted') {
      await requestPermission();
    }
    const fetchedAlbums = await MediaLibrary.getAlbumsAsync({
      includeSmartAlbums: true,
    });
    setAlbums(fetchedAlbums);
  }



  function toggleCameraFacing() {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  }
  function toggleFlash() {
    setFlash(current => (current === 'on' ? 'off' : 'on'));
  }


  async function takePicture() {
    if (cameraRef.current && !isCapturing && !isLongPress) {
      setIsCapturing(true);
      const photo = await cameraRef.current.takePictureAsync({
        quality: 1,
        skipProcessing: true,
        flash: flash === 'on' ? flash.on : flash.off, // Sử dụng giá trị FlashMode từ Camera.Constants
      });
      const fileInfo = await FileSystem.getInfoAsync(photo.uri);
      const fileName = photo.uri.split('/').pop();
      const mimeType = `image/jpeg`;
      photo["size"] = fileInfo.size
      photo["name"] = fileName
      photo["type"] = mimeType
      // console.log("Captured photo: ",photo);
      setCapturedPhoto(photo);
      formImage.image = photo
      setFormImage({
        ...formImage,
        image: photo,
      });
      setIsCapturing(false);
    }
  }

  function retakePicture() {
    setCapturedPhoto(null);
  }

  let recordVideo = async () => {
    setIsRecording(true);
    if (flash){
      setFlash("torch");
    }
    let options = {
      quality: "4:3",
      maxDuration: MAX_RECORDING_DURATION,
      mute: false,
      maxFileSize: 5 * 1024 * 1024,
      flash: flash === 'on' ? flash.on : flash.off, // Sử dụng giá trị FlashMode từ Camera.Constants
    };

    // await Image.getSize(form.thumbnail, (width, height) => {
    //   console.log("Thumbnail Width:", width);
    //   console.log("Thumbnail Height:", height);
    //   form.thumbnail["size"] = width *height
    //   form.thumbnail["mimeType"] = "image/jpeg"

    //   // You can now use width and height in your component
    // }, (error) => {
    //   console.error("Error loading thumbnail:", error);
    // });

    await cameraRef.current.recordAsync(options).then(async (recordedVideo) => {
      setVideo(recordedVideo);

      const fileInfo = await FileSystem.getInfoAsync(recordedVideo.uri);
      // Determine MIME type (this is an approximation)
      const fileExtension = recordedVideo.uri.split('.').pop();
      const fileName = recordedVideo.uri.split('/').pop();
      const mimeType = `video/${fileExtension}`;
      recordedVideo["size"] = fileInfo.size
      recordedVideo["name"] = fileName
      recordedVideo["mimeType"] = mimeType


      // console.log("File Size:", fileInfo.size);
      // console.log("MIME Type:", mimeType);
      // console.log("File name:", fileName);
      form.video = recordedVideo
      setForm({
        ...form,
        video: recordedVideo,
      });
      console.log(form);
      setIsRecording(false);
      setFlash("off");
    });


  };
  let stopRecording = () => {
    setIsRecording(false);
    cameraRef.current.stopRecording();
  };
  function reRecording() {
    setVideo(null);
  }

  function handlePressIn() {
    setIsLongPress(false);
    pressTimeoutRef.current = setTimeout(() => {
      setIsLongPress(true);
      recordVideo();
    }, 500); // Adjust the delay as needed
  }

  function handlePressOut() {
    if (pressTimeoutRef.current) {
      clearTimeout(pressTimeoutRef.current);
    }
    if (isLongPress) {
      stopRecording();
    } else {
      takePicture();
    }
  }


  let shareVideo = () => {
    shareAsync(video.uri).then(() => {
      setVideo(undefined);
    });
  };

  let saveVideo = async () => {
    if (hasMediaLibraryPermission.status !== 'granted') {
      await requestPermission();
    }
    await MediaLibrary.saveToLibraryAsync(video.uri).then(() => {
      setVideo(undefined);
    });
  };
  let savePicture = async () => {
    if (hasMediaLibraryPermission.status !== 'granted') {
      await requestPermission();
    }
    await MediaLibrary.saveToLibraryAsync(capturedPhoto.uri).then(() => {
      setCapturedPhoto(undefined);
    });
  };

  // if (video) {
  //   return (
  //     <SafeAreaView style={styles.container}>
  //       <Video
  //         style={styles.video}
  //         source={{uri: video.uri}}
  //         useNativeControls
  //         resizeMode='contain'
  //         isLooping
  //       />
  //       <Button title="Share" onPress={shareVideo} />
  //       {hasMediaLibraryPermission ? <Button title="Save" onPress={saveVideo} /> : undefined}
  //       <Button title="Discard" onPress={() => setVideo(undefined)} />
  //     </SafeAreaView>
  //   );
  // }

  return (
    <SafeAreaView className="bg-black-100">
      {/* <ScrollView className="w-full h-full"

        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#9Bd35A', '#689F38']}
          />
        }
      > */}



      <View className="w-full justify-center h-full">
        {(!capturedPhoto && hasCameraPermission && cameraReady) && ( // Chỉ hiển thị CameraView khi chưa có ảnh chụp
          <View>
            <View className="rounded-xl border-2 border-yellow-500 overflow-hidden">
              <Camera ref={cameraRef} style={{ width: width, height: width * 4 / 3 }} whiteBalance={"auto"} autoFocus flashMode={flash} type={facing} ratio='4:3'>
              </Camera>
            </View>


            <View style={styles.buttonContainer}>
              <IconButton icon={(flash=="on")?"flash-on":"flash-off"} label={(flash=="on")?"Flash On":"Flash Off"} onPress={toggleFlash} />
              <View style={{ marginHorizontal: 60 }} className="w-[84] h-[84] border-4 border-[#ffd33d] rounded-[42px] p-[3px]">
                <TouchableOpacity className="flex-1 justify-center items-center rounded-[42px] bg-white" disabled={isRecording} onPressIn={handlePressIn} onPressOut={handlePressOut}>
                  <MaterialIcons name="add" size={38} color="#25292e" />
                </TouchableOpacity>
              </View>
              <IconButton icon="cameraswitch" label="Switch" onPress={toggleCameraFacing} />

            </View>
          </View>
        )}


        {(video || capturedPhoto) && (
          <View style={styles.previewContainer}>
            {(capturedPhoto &&
              <View className="w-full justify-center h-full">
                <View className="rounded-xl border-2 border-yellow-500 overflow-hidden">
                  <View>
                    <Image source={{ uri: capturedPhoto.uri }} style={{ width: width, height: width * 4 / 3 }} />

                    <FormField
                      title=""
                      value={formImage.title}
                      placeholder="Đặt tiêu đề hấp dẫn cho ảnh của bạn..."
                      handleChangeText={(e) => setFormImage({ ...formImage, title: e })}
                      otherStyles="absolute left-1 right-1 bottom-0"
                    />
                  </View>


                </View>

                <View style={styles.buttonContainer}>
                  <IconButton icon="refresh" label="Rest" onPress={retakePicture} />
                  <CircleButton onPress={submitImage} icon="send"/>
                  <IconButton icon="save-alt" label="Save" onPress={savePicture} />
                </View>


              </View>
            )}

            {video &&
              (
                <View className="w-full justify-center h-full bg-black-100">
                  <View>
                    <Video
                      source={{ uri: video.uri }}
                      className="rounded-xl border-2 border-yellow-600"
                      style={{ width: width, height: width * 4 / 3 }}
                      resizeMode={ResizeMode.COVER}
                      useNativeControls
                      shouldPlay
                      isLooping
                    // onPlaybackStatusUpdate={(status) => {
                    //   if (status.didJustFinish) {
                    //     setPlay(false);
                    //   }
                    // }}
                    />

                    <FormField
                      title=""
                      value={form.title}
                      placeholder="Đặt tiêu đề hấp dẫn cho video của bạn..."
                      handleChangeText={(e) => setForm({ ...form, title: e })}
                      otherStyles="absolute left-1 right-1 bottom-0"
                    />
                  </View>

                  <View style={styles.buttonContainer}>


                    <IconButton icon="refresh" label="Rest" onPress={reRecording} />
                  <CircleButton onPress={submit} icon="send"/>
                  <IconButton icon="save-alt" label="Save" onPress={saveVideo} />
                  </View>



                </View>
              )}
          </View>
        )}
      </View>

      {/* </ScrollView> */}

    </SafeAreaView>

  );
}

export default Home

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  camera: {
    flex: 1,
  },
  previewContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  closeButton: {
    position: 'absolute',
    top: 32,
    right: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    padding: 8,
    borderRadius: 20,
  },
  closeButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 20,
    width: 24,
    height: 24,
  },
  buttonContainer: {
    // position: 'absolute',
    // bottom: 0,
    // left: 0,
    // right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    padding: 20,
  },
  iconButton: {
    padding: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 25,
  },
  disabledButton: {
    opacity: 0.5, // Giảm độ mờ khi nút bị vô hiệu hóa
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 50,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButton: {
    width: 80,
    height: 80,
    borderRadius: 50,
    backgroundColor: 'grey',
    justifyContent: 'center',
    alignItems: 'center',
  },
  outerCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 5,
    borderColor: 'white',
  },
  innerCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'white',
  },
  icon: {
    width: 24,
    height: 24,
    tintColor: 'white',
  },
  iconSend: {
    width: 35,
    height: 35,
    alignItems: 'center',
    alignContent: "center",
    tintColor: 'white',
  },
  rotatedIcon: {
    transform: [{ rotate: '180deg' }],
  },
});


