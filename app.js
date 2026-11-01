import { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';

export default function App() {
  const [perm, req] = useCameraPermissions();
  const cam = useRef(null);
  if(!perm?.granted) return <View style={styles.c}><TouchableOpacity style={styles.b} onPress={req}><Text style={{color:'#fff'}}>Allow Camera</Text></TouchableOpacity></View>;
  return (
    <View style={{flex:1}}>
      <CameraView ref={cam} style={{flex:1}} facing="front" />
      <View style={styles.bottom}>
        <Text style={{color:'#fff', marginBottom:10}}>FotoRecibo - Working Build!</Text>
        <TouchableOpacity style={styles.shutter} onPress={async()=>{ await cam.current.takePictureAsync(); alert("Photo taken!"); }} />
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  c:{flex:1, justifyContent:'center', alignItems:'center'},
  b:{backgroundColor:'#000', padding:15, borderRadius:20},
  bottom:{position:'absolute', bottom:30, alignSelf:'center', alignItems:'center'},
  shutter:{width:80,height:80, borderRadius:40, backgroundColor:'#fff', borderWidth:4}
});
