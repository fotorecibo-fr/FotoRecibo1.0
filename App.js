import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';

export default function App(){
  const [p, req] = useCameraPermissions();
  if(!p?.granted) return <View style={s.c}><TouchableOpacity style={s.btn} onPress={req}><Text style={s.w}>Allow Camera</Text></TouchableOpacity></View>;
  return <View style={{flex:1}}><CameraView style={{flex:1}} facing="front"/><View style={s.btm}><TouchableOpacity style={s.shutter}/></View></View>;
}
const s=StyleSheet.create({c:{flex:1,justifyContent:'center',alignItems:'center'},btn:{backgroundColor:'#000',padding:15,borderRadius:20},w:{color:'#fff'},btm:{position:'absolute',bottom:30,alignSelf:'center'},shutter:{width:80,height:80,borderRadius:40,backgroundColor:'#fff',borderWidth:4}});
