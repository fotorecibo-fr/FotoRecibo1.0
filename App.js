import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, ScrollView, Dimensions, Alert } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as MediaLibrary from 'expo-media-library';
import * as Print from 'expo-print';
import QRCode from 'react-native-qrcode-svg';
import { StatusBar } from 'expo-status-bar';

const { width } = Dimensions.get('window');

const LAYOUTS = [
  { id: '2strip', name: '2-Cut', shots: 2, desc: '2 photos vertical' },
  { id: '3strip', name: '3-Cut', shots: 3, desc: 'Classic strip' },
  { id: '4strip', name: '4-Cut', shots: 4, desc: 'Best seller' },
  { id: 'single', name: 'Single', shots: 1, desc: 'With frame' },
  { id: 'receipt', name: 'Instagram Receipt', shots: 4, desc: 'Long receipt' },
  { id: 'kiss', name: 'Kiss Mark', shots: 2, desc: 'With lips' },
];

const FILTERS = [
  { id: 'colored', name: 'Colored', color: '#ff7eb3' },
  { id: 'bw', name: 'B&W', color: '#333' },
  { id: 'sepia', name: 'Vintage', color: '#d2b48c' },
];

export default function App() {
  const [step, setStep] = useState('welcome'); // welcome, layout, filter, camera, preview, printing, done
  const [layout, setLayout] = useState(LAYOUTS[2]);
  const [filter, setFilter] = useState(FILTERS[0]);
  const [photos, setPhotos] = useState([]);
  const [countdown, setCountdown] = useState(null);
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef(null);

  useEffect(() => {
    if (!permission?.granted) requestPermission();
  }, []);

  const startCapture = async () => {
    setPhotos([]);
    captureNext(0);
  };

  const captureNext = (index) => {
    if (index >= layout.shots) {
      setStep('preview');
      return;
    }
    setCountdown(3);
    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev === 1) {
          clearInterval(interval);
          takePhoto(index);
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const takePhoto = async (index) => {
    if (cameraRef.current) {
      const photo = await cameraRef.current.takePictureAsync({ base64: true, quality: 0.7 });
      const newPhotos = [...photos, photo.uri];
      setPhotos(newPhotos);
      setTimeout(() => captureNext(index + 1), 800);
    }
  };

  const handlePrint = async () => {
    setStep('printing');
    try {
      const html = `
        <html><body style="margin:0;padding:10px;font-family:monospace;text-align:center;">
        <h2 style="font-family:cursive">Xavi's Snaps - ${layout.name}</h2>
        ${photos.map(p => `<img src="${p}" style="width:90%;margin:5px;border:5px solid white;box-shadow:0 2px 5px #ccc;" />`).join('')}
        ${layout.id === 'receipt' ? '<p>Instagram<br/>@xavis.snaps<br/>Thank you! </p>' : ''}
        ${layout.id === 'kiss' ? '<p style="color:#ff4d6d;font-size:30px;">💋 Kiss Kiss 💋</p>' : ''}
        </body></html>
      `;
      await Print.printAsync({ html });
      setStep('done');
    } catch (e) {
      Alert.alert('Print error', e.message);
      setStep('done');
    }
  };

  if (!permission) return <View style={styles.center}><Text>Loading camera...</Text></View>;
  if (!permission.granted) return <View style={styles.center}><Text>No camera permission</Text><TouchableOpacity onPress={requestPermission} style={styles.btn}><Text style={styles.btnText}>Allow Camera</Text></TouchableOpacity></View>;

  return (
    <View style={styles.container}>
      <StatusBar hidden />
      
      {step === 'welcome' && (
        <View style={styles.center}>
          <Text style={styles.logo}>Xavi's Snaps</Text>
          <Text style={styles.sub}>Selfie photo booth</Text>
          <TouchableOpacity style={[styles.btn, {marginTop:40}]} onPress={() => setStep('layout')}>
            <Text style={styles.btnText}>Start</Text>
          </TouchableOpacity>
        </View>
      )}

      {step === 'layout' && (
        <ScrollView contentContainerStyle={styles.scroll}>
          <Text style={styles.title}>Choose your style</Text>
          <View style={styles.grid}>
            {LAYOUTS.map(l => (
              <TouchableOpacity key={l.id} style={[styles.card, layout.id===l.id && styles.cardActive]} onPress={() => setLayout(l)}>
                <Text style={styles.cardName}>{l.name}</Text>
                <Text style={styles.cardDesc}>{l.desc}</Text>
                <Text style={styles.cardShots}>{l.shots} shots</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity style={styles.btn} onPress={() => setStep('filter')}><Text style={styles.btnText}>Continue</Text></TouchableOpacity>
        </ScrollView>
      )}

      {step === 'filter' && (
        <View style={styles.center}>
          <Text style={styles.title}>Choose filter</Text>
          <View style={{flexDirection:'row', gap:15}}>
            {FILTERS.map(f => (
              <TouchableOpacity key={f.id} onPress={() => setFilter(f)} style={[styles.filterBtn, {backgroundColor:f.color, borderWidth: filter.id===f.id?3:0}]}>
                <Text style={{color:'white', fontWeight:'bold'}}>{f.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Image source={{uri: photos[0] || 'https://i.pravatar.cc/300'}} style={[styles.previewImg, filter.id==='bw' && {tintColor:'gray'}]} />
          <TouchableOpacity style={styles.btn} onPress={startCapture}><Text style={styles.btnText}>Start Shooting - {layout.shots} photos</Text></TouchableOpacity>
        </View>
      )}

      {step === 'camera' || countdown !== null || (step === 'filter' && countdown===null && photos.length < layout.shots && step !== 'filter') ? null : null}

      {(step === 'filter' && photos.length===0) || step === 'camera' ? null : null}

      { (step === 'filter' || step === 'camera' || photos.length > 0 && photos.length < layout.shots) && (
        <View style={{flex:1}}>
          <CameraView ref={cameraRef} style={{flex:1}} facing="front" />
          {countdown && (
            <View style={styles.countdownOverlay}><Text style={styles.countdownText}>{countdown}</Text></View>
          )}
          <View style={styles.cameraFooter}>
            <Text style={styles.cameraText}>Photo {photos.length+1} / {layout.shots}</Text>
          </View>
        </View>
      )}

      {step === 'preview' && (
        <ScrollView contentContainerStyle={styles.scroll}>
          <Text style={styles.title}>Preview</Text>
          <View style={[styles.printPreview, layout.id==='receipt' && {backgroundColor:'#fffbe6'}]}>
            {photos.map((p,i) => (
              <Image key={i} source={{uri:p}} style={[styles.stripImg, filter.id==='bw' && {tintColor:'gray'}]} />
            ))}
            {layout.id==='kiss' && <Text style={{fontSize:24, textAlign:'center', marginTop:5}}>💋 Xavi's Snaps 💋</Text>}
            {layout.id==='receipt' && <Text style={{fontFamily:'monospace', fontSize:10, marginTop:10}}>Instagram @xavis.snaps{'\n'}Thank you for visiting!</Text>}
          </View>

          <View style={{flexDirection:'row', gap:10, marginTop:20}}>
            <TouchableOpacity style={[styles.btn, {backgroundColor:'#888', flex:1}]} onPress={() => { setPhotos([]); setStep('filter'); }}>
              <Text style={styles.btnText}>Retake</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.btn, {flex:1}]} onPress={() => setStep('printing_preview')}>
              <Text style={styles.btnText}>Print</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}

      {step === 'printing_preview' && (
        <View style={styles.center}>
          <Text style={styles.title}>Print preview</Text>
          <Text>Printing {layout.name} - {filter.name}</Text>
          <TouchableOpacity style={[styles.btn, {marginTop:20}]} onPress={handlePrint}>
            <Text style={styles.btnText}>Confirm Print</Text>
          </TouchableOpacity>
        </View>
      )}

      {step === 'printing' && (
        <View style={styles.center}>
          <Text style={styles.logo}>Printing...</Text>
          <Text>Please wait, your photo is coming out of printer slot</Text>
        </View>
      )}

      {step === 'done' && (
        <ScrollView contentContainerStyle={styles.scroll}>
          <Text style={styles.title}>Your photos are ready!</Text>
          <View style={{alignItems:'center', marginVertical:20}}>
            <QRCode value={`https://xavis-snaps.com/d/${Date.now()}`} size={180} />
            <Text style={{marginTop:10, fontWeight:'bold'}}>Scan to get digital copy</Text>
          </View>

          <View style={{flexDirection:'row', justifyContent:'space-around', width:'100%'}}>
            <View style={{alignItems:'center'}}><Text style={{fontWeight:'bold'}}>Picture</Text><Text>📸</Text></View>
            <View style={{alignItems:'center'}}><Text style={{fontWeight:'bold'}}>Boomerang</Text><Text>🔁</Text></View>
            <View style={{alignItems:'center'}}><Text style={{fontWeight:'bold'}}>Film</Text><Text>🎞️</Text></View>
          </View>

          <TouchableOpacity style={[styles.btn, {marginTop:30}]} onPress={() => { setPhotos([]); setStep('welcome'); }}>
            <Text style={styles.btnText}>Done - New Session</Text>
          </TouchableOpacity>

          <Text style={{marginTop:30, textAlign:'center', color:'#888'}}>DM US: Xavi's Snaps</Text>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container:{flex:1, backgroundColor:'#fdf6ee'},
  center:{flex:1, justifyContent:'center', alignItems:'center', padding:20},
  scroll:{padding:20, alignItems:'center', flexGrow:1},
  logo:{fontSize:48, fontFamily:'System', fontWeight:'900', color:'#5a2d0c'},
  sub:{fontSize:16, color:'#8a6a4a', marginTop:5},
  title:{fontSize:24, fontWeight:'bold', marginBottom:20, color:'#5a2d0c'},
  btn:{backgroundColor:'#5a2d0c', paddingVertical:14, paddingHorizontal:30, borderRadius:12, alignItems:'center'},
  btnText:{color:'white', fontWeight:'bold', fontSize:16},
  grid:{flexDirection:'row', flexWrap:'wrap', gap:10, justifyContent:'center'},
  card:{width: width/2 - 30, backgroundColor:'white', padding:15, borderRadius:12, borderWidth:2, borderColor:'#eee'},
  cardActive:{borderColor:'#5a2d0c', backgroundColor:'#fff1e0'},
  cardName:{fontWeight:'bold', fontSize:16},
  cardDesc:{fontSize:12, color:'#777', marginTop:2},
  cardShots:{fontSize:11, color:'#5a2d0c', marginTop:5, fontWeight:'bold'},
  filterBtn:{width:80, height:80, borderRadius:40, justifyContent:'center', alignItems:'center', borderColor:'#5a2d0c'},
  previewImg:{width:200, height:250, borderRadius:12, marginTop:20, backgroundColor:'#ddd'},
  countdownOverlay:{...StyleSheet.absoluteFillObject, backgroundColor:'rgba(0,0,0,0.3)', justifyContent:'center', alignItems:'center'},
  countdownText:{fontSize:120, color:'white', fontWeight:'bold'},
  cameraFooter:{position:'absolute', bottom:30, alignSelf:'center', backgroundColor:'rgba(0,0,0,0.6)', padding:10, borderRadius:20},
  cameraText:{color:'white', fontWeight:'bold'},
  printPreview:{backgroundColor:'white', padding:10, borderRadius:5, width:220, alignItems:'center', elevation:5, shadowColor:'#000'},
  stripImg:{width:180, height:135, marginVertical:3, borderRadius:4, backgroundColor:'#eee'},
});
