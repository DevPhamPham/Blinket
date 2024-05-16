import { Camera } from 'expo-camera';
import { useState, useRef, useEffect } from 'react';
import { Button, StyleSheet, Text, TouchableOpacity, View, Image, Alert, SafeAreaView, useWindowDimensions } from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { Video, ResizeMode } from 'expo-av'


import { shareAsync } from 'expo-sharing';
import * as MediaLibrary from 'expo-media-library';

import { icons } from "../../constants";
import VideoCard from '../../components/VideoCard'

const MAX_RECORDING_DURATION = 5; // Giới hạn thời gian quay 5 giây

const Home = () => {
  const { width } = useWindowDimensions();


  const [facing, setFacing] = useState('back');
  const [flash, setFlash] = useState("off");

  const [capturedPhoto, setCapturedPhoto] = useState(null);
  const [isCapturing, setIsCapturing] = useState(false);

  let cameraRef = useRef();
  const [hasCameraPermission, setHasCameraPermission] = Camera.useCameraPermissions();
  const [hasMicrophonePermission, setHasMicrophonePermission] = Camera.useMicrophonePermissions();
  const [hasMediaLibraryPermission, requestPermission] = MediaLibrary.usePermissions();
  const [isRecording, setIsRecording] = useState(false);
  const [video, setVideo] = useState(null);
  const [albums, setAlbums] = useState(null);

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
    if (cameraRef.current && !isCapturing) {
      setIsCapturing(true);
      const photo = await cameraRef.current.takePictureAsync({
        quality: 1,
        // skipProcessing: true,
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
      quality: "1080p",
      maxDuration: 5,
      mute: false,
      maxFileSize: 10 * 1024 * 1024
    };

    await cameraRef.current.recordAsync(options).then((recordedVideo) => {
      setVideo(recordedVideo);
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

  // if (video) {
  //   let shareVideo = () => {
  //     shareAsync(video.uri).then(() => {
  //       setVideo(undefined);
  //     });
  //   };

  //   let saveVideo = () => {
  //     MediaLibrary.saveToLibraryAsync(video.uri).then(() => {
  //       setVideo(undefined);
  //     });
  //   };

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
      <View className="w-full justify-center h-full">
        {!video && ( // Chỉ hiển thị CameraView khi chưa có ảnh chụp
          <View>
            <View className="rounded-xl border-2 border-yellow-500 overflow-hidden">
              <Camera ref={cameraRef}  style={{ width: width, height: width }} whiteBalance={"auto"} autoFocus flashMode={flash} type={facing} ratio='1:1'>
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
                onPress={takePicture}
                onPressIn={recordVideo}
                onPressOut={stopRecording}
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

        {/* {capturedPhoto && (
        <View style={styles.previewContainer}>
          <Image source={{ uri: capturedPhoto.uri }} style={styles.previewImage} />
          <TouchableOpacity
            style={styles.closeButton}
            onPress={retakePicture}
          >
            <Text style={styles.closeButtonText}>X</Text>
          </TouchableOpacity>
        </View>
      )} */}


        {video && (
          <View style={styles.previewContainer}>
            {/* <Image source={{ uri: capturedPhoto.uri }} style={styles.previewImage} /> */}

            <Video
              source={{ uri: video.uri }}
              className="rounded-xl"
              style={{ width: width, height: width }}
              resizeMode={ResizeMode.COVER}
              useNativeControls
              shouldPlay
            // onPlaybackStatusUpdate={(status) => {
            //   if (status.didJustFinish) {
            //     setPlay(false);
            //   }
            // }}
            />


            <TouchableOpacity
              style={styles.closeButton}
              onPress={reRecording}
            >
              <Text style={styles.closeButtonText}>X</Text>
            </TouchableOpacity>
          </View>
        )}

      </View>
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
    color: 'black',
    fontWeight: 'bold',
    fontSize: 16,
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
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'white',
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
});
