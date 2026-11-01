import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';

export default function App(){
  const [facing, setFacing] = useState('front');
  const [mirrored, setMirrored] = useState(true);
  const [permission, requestPermission] = useCameraPermissions();
  const [showCam, setShowCam] = useState(false);
  const camRef = useRef(null);

  if(!permission) return <View/>;
  if(!permission.granted){
    return (
      <View style={s.container}>
        <Text style={s.text}>Need camera permission</Text>
        <TouchableOpacity onPress={requestPermission} style={s.btn}><Text style={s.btnT}>Allow Camera</Text></TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={s.container}>
      {!showCam ? (
        <View style={s.center}>
          <Text style={s.logo}>FOTO RECIBO - MIRROR {mirrored?'ON':'OFF'}</Text>
          <Text style={s.sub}>B&W RECEIPT - MIRRORED - 5s TIMER</Text>
          <TouchableOpacity style={s.startBtn} onPress={()=>setShowCam(true)}><Text style={s.startTxt}>TAP TO START</Text></TouchableOpacity>
          <TouchableOpacity onPress={()=>setMirrored(!mirrored)} style={s.toggle}><Text style={s.text}>Mirror {mirrored?'ON':'OFF'}</Text></TouchableOpacity>
        </View>
      ) : (
        <CameraView ref={camRef} style={s.camera} facing={facing} mirror={mirrored}>
          <View style={s.controls}>
            <TouchableOpacity onPress={()=>setShowCam(false)} style={s.btn}><Text style={s.btnT}>CLOSE</Text></TouchableOpacity>
            <TouchableOpacity onPress={()=>setMirrored(!mirrored)} style={s.btn}><Text style={s.btnT}>MIRROR {mirrored?'ON':'OFF'}</Text></TouchableOpacity>
            <TouchableOpacity onPress={()=>setFacing(facing==='front'?'back':'front')} style={s.btn}><Text style={s.btnT}>FLIP</Text></TouchableOpacity>
          </View>
        </CameraView>
      )}
    </View>
  );
}
const s = StyleSheet.create({
  container:{flex:1,backgroundColor:'black'},
  center:{flex:1,justifyContent:'center',alignItems:'center'},
  logo:{color:'white',fontWeight:'bold',fontSize:18,marginBottom:10},
  sub:{color:'gray',marginBottom:30},
  text:{color:'white'},
  startBtn:{backgroundColor:'white',padding:20,borderRadius:10,marginBottom:20},
  startTxt:{color:'black',fontWeight:'bold',fontSize:20},
  toggle:{padding:15,borderWidth:1,borderColor:'white',borderRadius:10},
  camera:{flex:1},
  controls:{flex:1,justifyContent:'flex-end',flexDirection:'row',padding:20,gap:10},
  btn:{backgroundColor:'white',padding:10,borderRadius:5},
  btnT:{color:'black',fontWeight:'bold'}
});
