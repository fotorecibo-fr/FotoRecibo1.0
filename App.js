import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, ScrollView, Dimensions, Alert, Switch } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Print from 'expo-print';
import QRCode from 'react-native-qrcode-svg';
import { StatusBar } from 'expo-status-bar';

const { width } = Dimensions.get('window');

const LAYOUTS = [
  { id: '2strip', name: '2-Cut', shots: 2, desc: 'Couple' },
  { id: '3strip', name: '3-Cut', shots: 3, desc: 'Classic' },
  { id: '4strip', name: '4-Cut', shots: 4, desc: 'Best seller' },
  { id: 'single', name: 'Single 4x6', shots: 1, desc: 'Portrait' },
  { id: 'receipt', name: 'Receipt', shots: 4, desc: 'Thermal 58mm' },
  { id: 'kiss', name: 'Kiss Mark', shots: 2, desc: 'With kiss' },
];

const FILTERS = [
  { id: 'colored', name: 'Colored', color: '#ff7eb3' },
  { id: 'bw', name: 'B&W', color: '#222' },
  { id: 'sepia', name: 'Vintage', color: '#d2b48c' },
];

export default function App() {
  const [step, setStep] = useState('welcome');
  const [layout, setLayout] = useState(LAYOUTS[2]);
  const [filter, setFilter] = useState(FILTERS[0]);
  const [photos, setPhotos] = useState([]);
  const [countdown, setCountdown] = useState(null);
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef(null);
  const [tapCount, setTapCount] = useState(0);
  const [settings, setSettings] = useState({
    timer: 3,
    boothName: 'Foto Recibo',
    igHandle: '@fotorecibo.ph',
    priceColored: 100,
    priceThermal: 50,
  });

  useEffect(() => { if (!permission?.granted) requestPermission(); }, []);

  const onLogoTap = () => {
    const n = tapCount + 1;
    setTapCount(n);
    if (n >= 5) { setStep('admin'); setTapCount(0); }
    setTimeout(() => setTapCount(0), 2000);
  };

  const startCapture = () => { setPhotos([]); setStep('camera'); captureNext(0); };
  const captureNext = (idx) => {
    if (idx >= layout.shots) { setStep('preview'); return; }
    setCountdown(settings.timer);
    const it = setInterval(() => {
      setCountdown(p => {
        if (p === 1) { clearInterval(it); doTake(idx); return null; }
        return p - 1;
      });
    }, 1000);
  };
  const doTake = async (idx) => {
    if (cameraRef.current) {
      const pic = await cameraRef.current.takePictureAsync({ quality: 0.7 });
      const arr = [...photos, pic.uri];
      setPhotos(arr);
      setTimeout(() => captureNext(idx + 1), 700);
    }
  };

  const testPrint = async (type) => {
    try {
      if (type === 'colored') {
        await Print.printAsync({ html: `<html><body style="text-align:center;font-family:monospace;padding:20px;"><h1 style="font-family:cursive;color:#5a2d0c;">${settings.boothName}</h1><p>Test Colored OK - Canon Connected</p><div style="height:80px;background:linear-gradient(90deg,red,orange,yellow,green,blue,purple);"></div><p>${new Date().toLocaleString()}</p></body></html>` });
      } else {
        await Print.printAsync({ html: `<html><body style="width:48mm;font-family:monospace;text-align:center;"><h3>${settings.boothName}</h3><p>Test Thermal OK!</p><p>${settings.igHandle}</p><p>Thank you!</p></body></html>` });
      }
    } catch (e) { Alert.alert('Print failed', e.message); }
  };

  const doPrint = async (type) => {
    setStep('printing');
    try {
      let html = '';
      if (type === 'colored') {
        html = `<html><body style="margin:0;display:flex;justify-content:center;background:white;"><div style="width:4in;padding:0.15in;text-align:center;font-family:monospace;"><h2 style="font-family:cursive;margin:0 0 5px 0;color:#5a2d0c;">${settings.boothName}</h2><p style="font-size:10px;margin:0 0 5px 0;">${layout.name} | ${filter.name}</p>${photos.map(u => `<img src="${u}" style="width:100%;margin:3px 0;border:3px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.2);" />`).join('')}${layout.id==='kiss'?'<p style="color:#ff4d6d;font-size:22px;margin:5px 0;">💋 Kiss Kiss 💋</p>':''}<p style="font-size:9px;margin-top:8px;">${settings.igHandle} | ${new Date().toLocaleDateString()}</p></div></body></html>`;
      } else {
        html = `<html><body style="width:48mm;margin:0;padding:4px;font-family:monospace;font-size:10px;text-align:center;background:white;color:black;"><h3 style="margin:0;">${settings.boothName}</h3><p style="margin:2px 0;">${layout.name} | ${filter.name}</p><p style="margin:2px 0;font-size:8px;">${new Date().toLocaleString()}</p><hr style="border:1px dashed black;margin:6px 0;"/>${photos.map(u => `<img src="${u}" style="width:46mm;filter:grayscale(100%);margin:2px 0;" />`).join('')}<hr style="border:1px dashed black;margin:6px 0;"/><p style="margin:4px 0;">Scan for digital copy</p><p style="font-size:8px;">Picture | Boomerang | Film</p><p style="margin-top:8px;font-size:9px;">${settings.igHandle}</p><p>Thank you!</p><br/><br/></body></html>`;
      }
      await Print.printAsync({ html });
      setStep('done');
    } catch (e) { Alert.alert('Error', e.message); setStep('printing_preview'); }
  };

  if (!permission) return <View style={styles.center}><Text>Loading...</Text></View>;
  if (!permission.granted) return <View style={styles.center}><TouchableOpacity style={styles.btn} onPress={requestPermission}><Text style={styles.btnText}>Allow Camera</Text></TouchableOpacity></View>;

  return (
    <View style={styles.container}>
      <StatusBar hidden />
      {step === 'welcome' && (
        <View style={styles.center}>
          <TouchableOpacity onPress={onLogoTap}><Text style={styles.logo}>{settings.boothName}</Text></TouchableOpacity>
          <Text style={styles.sub}>Photobooth • Receipt • Memories</Text>
          <Text style={styles.hint}>Tap logo 5x for Admin {tapCount>0?`(${tapCount}/5)`:''}</Text>
          <TouchableOpacity style={[styles.btn,{marginTop:40,width:220}]} onPress={()=>setStep('layout')}><Text style={styles.btnText}>Tap to Start</Text></TouchableOpacity>
          <Text style={styles.small}>Picture | Boomerang | Film</Text>
        </View>
      )}

      {step === 'admin' && (
        <ScrollView contentContainerStyle={styles.admin}>
          <Text style={styles.title}>🔧 Foto Recibo Admin</Text>
          <View style={styles.card}><Text style={styles.cardTitle}>🖨️ Printer Test</Text><TouchableOpacity style={[styles.btn,{backgroundColor:'#ff7eb3',marginBottom:10}]} onPress={()=>testPrint('colored')}><Text style={styles.btnText}>Test Colored (Canon Selphy)</Text></TouchableOpacity><TouchableOpacity style={[styles.btn,{backgroundColor:'#333'}]} onPress={()=>testPrint('thermal')}><Text style={styles.btnText}>Test Thermal (58mm)</Text></TouchableOpacity><Text style={styles.note}>Pair printers in tablet Settings > Bluetooth/WiFi first</Text></View>
          <View style={styles.card}><Text style={styles.cardTitle}>⚙️ Settings</Text><View style={styles.row}><Text>Timer</Text><View style={styles.row}><TouchableOpacity onPress={()=>setSettings({...settings,timer:3})} style={[styles.chip, settings.timer===3&&styles.chipOn]}><Text>3s</Text></TouchableOpacity><TouchableOpacity onPress={()=>setSettings({...settings,timer:5})} style={[styles.chip, settings.timer===5&&styles.chipOn]}><Text>5s</Text></TouchableOpacity></View></View><View style={styles.row}><Text>Colored Price</Text><Text>₱{settings.priceColored}</Text></View><View style={styles.row}><Text>Thermal Price</Text><Text>₱{settings.priceThermal}</Text></View></View>
          <View style={styles.card}><Text style={styles.cardTitle}>📸 Branding</Text><Text>{settings.boothName}</Text><Text>{settings.igHandle}</Text></View>
          <TouchableOpacity style={[styles.btn,{marginTop:10}]} onPress={()=>setStep('welcome')}><Text style={styles.btnText}>← Back to Booth</Text></TouchableOpacity>
        </ScrollView>
      )}

      {step === 'layout' && (
        <ScrollView contentContainerStyle={styles.scroll}><Text style={styles.title}>Choose Style</Text><View style={styles.grid}>{LAYOUTS.map(l=><TouchableOpacity key={l.id} style={[styles.layoutCard, layout.id===l.id&&styles.layoutOn]} onPress={()=>setLayout(l)}><Text style={styles.layoutName}>{l.name}</Text><Text style={styles.layoutDesc}>{l.desc}</Text><Text style={styles.layoutShots}>{l.shots} shots</Text></TouchableOpacity>)}</View><TouchableOpacity style={styles.btn} onPress={()=>setStep('filter')}><Text style={styles.btnText}>Continue</Text></TouchableOpacity></ScrollView>
      )}

      {step === 'filter' && (
        <View style={styles.center}><Text style={styles.title}>Choose Filter</Text><View style={{flexDirection:'row',gap:12}}>{FILTERS.map(f=><TouchableOpacity key={f.id} onPress={()=>setFilter(f)} style={[styles.filter, {backgroundColor:f.color, borderWidth: filter.id===f.id?3:0}]}><Text style={{color:'white',fontWeight:'bold'}}>{f.name}</Text></TouchableOpacity>)}</View><TouchableOpacity style={[styles.btn,{marginTop:30}]} onPress={startCapture}><Text style={styles.btnText}>Start {layout.shots} Shots - {settings.timer}s</Text></TouchableOpacity></View>
      )}

      {step === 'camera' && (
        <View style={{flex:1}}><CameraView ref={cameraRef} style={{flex:1}} facing="front" />{countdown&&<View style={styles.countBox}><Text style={styles.countTxt}>{countdown}</Text></View>}<View style={styles.camFooter}><Text style={styles.camTxt}>Photo {photos.length+1} / {layout.shots}</Text></View></View>
      )}

      {step === 'preview' && (
        <ScrollView contentContainerStyle={styles.scroll}><Text style={styles.title}>Preview</Text><View style={styles.printBox}>{photos.map((p,i)=><Image key={i} source={{uri:p}} style={[styles.strip, filter.id==='bw'&&{tintColor:'gray'}]} />)}{layout.id==='kiss'&&<Text style={{fontSize:20,marginTop:5,textAlign:'center'}}>💋 Foto Recibo 💋</Text>}</View><View style={{flexDirection:'row',gap:10,marginTop:20}}><TouchableOpacity style={[styles.btn,{backgroundColor:'#888',flex:1}]} onPress={()=>{setPhotos([]);setStep('filter');}}><Text style={styles.btnText}>Retake</Text></TouchableOpacity><TouchableOpacity style={[styles.btn,{flex:1}]} onPress={()=>setStep('printing_preview')}><Text style={styles.btnText}>Print</Text></TouchableOpacity></View></ScrollView>
      )}

      {step === 'printing_preview' && (
        <View style={styles.center}><Text style={styles.title}>Choose Printer</Text><TouchableOpacity style={[styles.btn,{backgroundColor:'#ff7eb3',width:'90%',marginBottom:12}]} onPress={()=>doPrint('colored')}><Text style={styles.btnText}>🎨 Colored Print - Canon</Text><Text style={{color:'white',fontSize:11}}>₱{settings.priceColored} Full color 4x6</Text></TouchableOpacity><TouchableOpacity style={[styles.btn,{backgroundColor:'#333',width:'90%'}]} onPress={()=>doPrint('thermal')}><Text style={styles.btnText}>🧾 Thermal Print - Receipt</Text><Text style={{color:'white',fontSize:11}}>₱{settings.priceThermal} B&W 58mm</Text></TouchableOpacity><TouchableOpacity onPress={()=>setStep('preview')}><Text style={{color:'#888',marginTop:15}}>← Back</Text></TouchableOpacity></View>
      )}

      {step === 'printing' && (<View style={styles.center}><Text style={styles.logo}>Printing...</Text><Text>Please wait...</Text></View>)}
      {step === 'done' && (
        <ScrollView contentContainerStyle={styles.scroll}><Text style={styles.title}>Your receipt is ready!</Text><View style={{alignItems:'center',marginVertical:15}}><QRCode value={`https://foto-recibo.com/${Date.now()}`} size={170} /><Text style={{marginTop:8,fontWeight:'bold'}}>Scan for digital copy</Text></View><View style={{flexDirection:'row',gap:30}}><Text>📸 Picture</Text><Text>🔁 Boomerang</Text><Text>🎞️ Film</Text></View><TouchableOpacity style={[styles.btn,{marginTop:25}]} onPress={()=>{setPhotos([]);setStep('welcome');}}><Text style={styles.btnText}>Done - New Customer</Text></TouchableOpacity><Text style={{marginTop:20,color:'#888'}}>DM: {settings.igHandle}</Text></ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container:{flex:1,backgroundColor:'#fdf6ee'},
  center:{flex:1,justifyContent:'center',alignItems:'center',padding:20},
  scroll:{padding:20,alignItems:'center',flexGrow:1},
  admin:{padding:20},
  card:{backgroundColor:'white',padding:15,borderRadius:12,marginBottom:12,elevation:2},
  cardTitle:{fontWeight:'bold',marginBottom:10,fontSize:16},
  note:{fontSize:11,color:'#888',marginTop:6},
  row:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginVertical:5},
  chip:{paddingHorizontal:14,paddingVertical:6,borderRadius:20,backgroundColor:'#eee',marginLeft:6},
  chipOn:{backgroundColor:'#f5e6d3',borderWidth:1,borderColor:'#5a2d0c'},
  logo:{fontSize:42,fontWeight:'900',color:'#5a2d0c',fontFamily:'System'},
  sub:{color:'#8a6a4a',marginTop:4,letterSpacing:1},
  hint:{fontSize:11,color:'#bbb',marginTop:8},
  small:{fontSize:12,color:'#aaa',marginTop:30,letterSpacing:2},
  title:{fontSize:24,fontWeight:'bold',color:'#5a2d0c',marginBottom:18},
  btn:{backgroundColor:'#5a2d0c',paddingVertical:14,paddingHorizontal:28,borderRadius:12,alignItems:'center'},
  btnText:{color:'white',fontWeight:'bold',fontSize:14},
  grid:{flexDirection:'row',flexWrap:'wrap',gap:10,justifyContent:'center',marginBottom:20},
  layoutCard:{width:width/2-30,backgroundColor:'white',padding:14,borderRadius:12,borderWidth:2,borderColor:'#eee'},
  layoutOn:{borderColor:'#5a2d0c',backgroundColor:'#fff1e0'},
  layoutName:{fontWeight:'bold',fontSize:15},
  layoutDesc:{fontSize:11,color:'#777',marginTop:2},
  layoutShots:{fontSize:10,color:'#5a2d0c',marginTop:4,fontWeight:'bold'},
  filter:{width:80,height:80,borderRadius:40,justifyContent:'center',alignItems:'center',borderColor:'#5a2d0c'},
  countBox:{...StyleSheet.absoluteFillObject,backgroundColor:'rgba(0,0,0,0.3)',justifyContent:'center',alignItems:'center'},
  countTxt:{fontSize:120,color:'white',fontWeight:'bold'},
  camFooter:{position:'absolute',bottom:25,alignSelf:'center',backgroundColor:'rgba(0,0,0,0.6)',padding:10,borderRadius:20},
  camTxt:{color:'white',fontWeight:'bold'},
  printBox:{backgroundColor:'white',padding:8,width:210,borderRadius:6,elevation:4,alignItems:'center'},
  strip:{width:175,height:130,marginVertical:2,borderRadius:3,backgroundColor:'#eee'},
});
