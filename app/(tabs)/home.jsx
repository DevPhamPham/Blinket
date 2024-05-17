import { router } from "expo-router";

import FormField from "../../components/FormFieldUpload"
import { icons } from "../../constants";
import { createVideoPost } from "../../lib/appwrite";

import { Camera } from 'expo-camera';
import React, { useState, useRef, useEffect } from 'react';
import { Button, ScrollView, StyleSheet, Text, TouchableOpacity, View, Image, Alert, SafeAreaView, useWindowDimensions, RefreshControl } from 'react-native';
import { Video, ResizeMode } from 'expo-av'
import { useIsFocused } from '@react-navigation/native';


import { shareAsync } from 'expo-sharing';
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system';

import { useGlobalContext } from "../../context/GlobalProvider";

const MAX_RECORDING_DURATION = 4; // Giới hạn thời gian quay 5 giây

const Home = () => {
  const { user } = useGlobalContext();
  const { width } = useWindowDimensions();
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    title: "",
    video: null,
    thumbnail: {"name": "test.jpg", "size": 120000, "type": "image/jpeg", "uri": "https://picsum.photos/400/300"}, //"https://picsum.photos/400/300"
    prompt: "My promt...",
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
        thumbnail: {"name": "thumbnail_random_picscum.jpg", "size": 174000, "type": "image/jpeg", "uri": "https://picsum.photos/400/300"},
        prompt: "My promt...",
      });

      setUploading(false);
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
      setCapturedPhoto(photo);
      setIsCapturing(false);
    }
  }

  function retakePicture() {
    setCapturedPhoto(null);
  }

  let recordVideo = async () => {
    setIsRecording(true);
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
    <SafeAreaView className="bg-primary">
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
              <TouchableOpacity style={styles.iconButton} onPress={toggleFlash}>
                <Image
                  source={flash === 'on' ? icons.flash_on : icons.flash}
                  resizeMode="contain"
                  style={styles.icon}
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.captureButton, isRecording && styles.disabledButton]} // Disable khi đang chụp
                disabled={isRecording} // Vô hiệu hóa nút khi đang chụp ảnh
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
              >
                <Image
                  source={icons.camera} // Chỉ sử dụng icon camera
                  resizeMode="contain"
                  style={styles.icon}
                />
              </TouchableOpacity>

              <TouchableOpacity style={styles.iconButton} onPress={toggleCameraFacing}>
                <Image
                  source={icons.flip}
                  resizeMode="contain"
                  style={styles.icon}
                />
              </TouchableOpacity>
            </View>
          </View>
        )}


        {(video || capturedPhoto) && (
          <View style={styles.previewContainer}>
            {(capturedPhoto &&
              <View className="w-full justify-center h-full">
                <View className="rounded-xl border-2 border-yellow-500 overflow-hidden">
                  <Image source={{ uri: capturedPhoto.uri }} style={{ width: width, height: width * 4 / 3 }} />
                </View>
                {/* <TouchableOpacity
                  style={styles.closeButton}
                  onPress={retakePicture}
                >
                  <Text style={styles.closeButtonText}>X</Text>
                </TouchableOpacity> */}

                <View style={styles.buttonContainer}>
                  <TouchableOpacity onPress={retakePicture}>
                    <Text style={styles.closeButtonText}>X</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.sendButton, isCapturing]} // Disable khi đang chụp
                    disabled={isCapturing} // Vô hiệu hóa nút khi đang chụp ảnh
                  // onPress={}
                  // onPressIn={recordVideo}
                  // onPressOut={stopRecording}
                  >
                    <Image
                      source={icons.send} // Chỉ sử dụng icon send
                      resizeMode="contain"
                      style={styles.iconSend}
                    />
                  </TouchableOpacity>

                  <TouchableOpacity onPress={savePicture}>
                    <Image
                      source={icons.share}
                      resizeMode="contain"
                      style={[styles.icon, styles.rotatedIcon]}
                    />
                  </TouchableOpacity>
                </View>


              </View>
            )}

            {video &&
              (
                <View className="w-full justify-center h-full bg-primary">
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
                      otherStyles="absolute left-0 right-0 bottom-0"
                    />
                  </View>

                  <View style={styles.buttonContainer}>
                    <TouchableOpacity onPress={reRecording}>
                      <Text style={styles.closeButtonText}>X</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.sendButton, isRecording]} // Disable khi đang chụp
                      onPress={submit}
                    // onPressIn={recordVideo}
                    // onPressOut={stopRecording}
                    >
                      <Image
                        source={icons.send} // Chỉ sử dụng icon send
                        resizeMode="contain"
                        style={styles.iconSend}
                      />
                    </TouchableOpacity>

                    <TouchableOpacity onPress={saveVideo}>
                      <Image
                        source={icons.share}
                        resizeMode="contain"
                        style={[styles.icon, styles.rotatedIcon]}
                      />
                    </TouchableOpacity>
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


