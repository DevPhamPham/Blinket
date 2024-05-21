import { useState } from "react";
import * as Animatable from "react-native-animatable";
import {
  ActivityIndicator,
  FlatList,
  Image,
  TouchableOpacity,
  View,
  useWindowDimensions
} from "react-native";

import ImageViewer from 'react-native-image-zoom-viewer';
import Modal from "react-native-modal";
import FastImage from "react-native-fast-image";
import { createImageProgress } from "react-native-image-progress";
import {wrapIntoModal} from 'expo-modal';


const ImageCom = createImageProgress(Image)

const zoomIn = {
  0: {
    scale: 0.9,
  },
  1: {
    scale: 1,
  },
};

const zoomOut = {
  0: {
    scale: 1,
  },
  1: {
    scale: 0.9,
  },
};

const ImageItem = ({ activeItem, item }) => {
  const [isZoomed, setIsZoomed] = useState(false);
  let { width, height } = useWindowDimensions(); 
  width/=2
  height/=2

  const handlePress = () => {
    // setIsZoomed(true);
    
  };

  const renderLoading = () => {
    return (<ActivityIndicator color={'white'} size={'large'} />)
  }

  return (
    <>
      <Animatable.View
        className="mr-5"
        animation={activeItem === item.$id ? zoomIn : zoomOut}
        duration={500}
      >
        <TouchableOpacity onPress={handlePress}>
          <Image
            source={{ uri: item.image, priority: 'high' }}
            resizeMode="cover"
            blurRadius={activeItem === item.$id ? 0 : 10}
            className="w-52 h-72 rounded-[33px] mt-3 bg-white/10"
            indicator={renderLoading}
          // style={style}
          />
        </TouchableOpacity>
      </Animatable.View>

      {isZoomed ?(<View style={{ width, height }} className="z-9999999">
       <ImageViewer
          index={0}
          imageUrls={[{ url: item.image}]}
          renderImage={(props) => <Image {...props} />}
          backgroundColor="black"
          enableSwipeDown
          saveToLocalByLongPress={false}
        />
      </View>):null}



    </>
  );
};

const ImageCard = ({ posts }) => {
  const [activeItem, setActiveItem] = useState(posts[0]);

  const viewableItemsChanged = ({ viewableItems }) => {
    if (viewableItems.length > 0) {
      setActiveItem(viewableItems[0].key);
    }
  };

  return (
    <FlatList
      data={posts}
      horizontal
      keyExtractor={(item) => item.$id}
      renderItem={({ item }) => (
        <ImageItem activeItem={activeItem} item={item} />
      )}
      onViewableItemsChanged={viewableItemsChanged}
      viewabilityConfig={{
        itemVisiblePercentThreshold: 70,
      }}
      contentOffset={{ x: 170 }}
    />
  );
};

export default ImageCard;
