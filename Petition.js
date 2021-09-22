import React, { Component } from 'react';
import { StyleSheet, Platform, Text, View, TouchableOpacity, Alert, TextInput, Image, BackHandler, ScrollView, Dimensions, PermissionsAndroid, Modal, Animated } from 'react-native';
import Voice from 'react-native-voice';
import { createAppContainer } from 'react-navigation';
import { Icon } from 'react-native-elements'
import AsyncStorage from '@react-native-community/async-storage';
import * as ImagePicker from 'react-native-image-picker';
import ImageZoom from 'react-native-image-pan-zoom';
import evaluate from 'words-to-numbers-es';
import { RFPercentage } from "react-native-responsive-fontsize";
import base64 from 'react-native-base64'

class PetitionScreen extends Component {
    
    constructor(props) {
      super(props);
      this.state = {
        title:"",
        petitionType: "",
        petitionID: "",
        data: [],
        recognized: '',
        started: '',
        results: [],
        is_recording: false,
        listenedData: "",
        interpretedData: "",
        cifValue: "",
        getData: false,
        setData: false,
        images: [],
        words: [],
        list: [],
        savedData: [],
        userid: "",
        flatlistPos: 0,
        saved: false,
        flag: 0,
        fadeAnimation: new Animated.Value(0),
        timer: 0,
        seconds: 15,
        hasStarted: false,
        listenFlag: 0,
        showResult: false
      }
      this.init()
      Voice.onSpeechStart = this.onSpeechStart.bind(this);
      Voice.onSpeechRecognized = this.onSpeechRecognized.bind(this);
      Voice.onSpeechResults = this.onSpeechResults.bind(this);
    }

    componentDidMount() {
      BackHandler.addEventListener('hardwareBackPress', this.goBack);
    }
  
    goBack = () => {
      this._stopRecognition(this)
      this.props.navigation.push('PetitionHistory')
      return true
    }
  
    async init() {
      await AsyncStorage.getItem("petitionType").then((value) => {
        this.setState({ petitionType: value })
      })
      await AsyncStorage.getItem("petitionID").then((value) => {
        this.setState({ petitionID: JSON.parse(value).id })
      })
      await AsyncStorage.getItem("data").then((value) => {
        this.setState({ title: JSON.parse(value).titulo }) 
        this.setState({ data: JSON.parse(value).campos })  
      })
      await AsyncStorage.getItem("userid").then((value) => {
        this.setState({ userid: value })
      })
      await AsyncStorage.getItem(this.state.petitionID+".listenFlag").then((value) => {
        if (value != null) {
          this.setState({ listenFlag: value })
        }
      })
      await AsyncStorage.getItem(this.state.petitionID+".saved").then((value) => {
        if (value != null) {
          this.setState({ saved: JSON.parse(value) })
        }
      })
      await AsyncStorage.getItem(this.state.petitionID+".savedData").then((value) => {
        if (value != null) {
          this.setState({ savedData: JSON.parse(value) })
        }
      })
      if (this.state.savedData.length == 0) {
        var array = []
        this.state.data.forEach((i) => {
          var result = null
          if (i.xdefecto != "") {
            if (i.xdefecto.toLowerCase() == "hoy") {
              result = ("0" + (new Date().getDate())).slice(-2)+ "-"+ ("0" + (new Date().getMonth() + 1)).slice(-2) + "-" + new Date().getFullYear()
            } else if (i.xdefecto.toLowerCase() == "ayer") {
              result = ("0" + (new Date().getDate()-1)).slice(-2)+ "-"+ ("0" + (new Date().getMonth() + 1)).slice(-2) + "-" + new Date().getFullYear()
            } else {
              result = i.xdefecto
            }
          }
          array.push({
            idcampo:i.idcampo,
            titulo: i.titulo,
            tipoexp: i.tipoexp,
            xdefecto: i.xdefecto,
            obligatorio: i.obligatorio,
            escuchado: "",
            valor: result
          })
        })
        await AsyncStorage.setItem(this.state.petitionID+".savedData", JSON.stringify(array))
        this.setState({ savedData: array })
      }
      await AsyncStorage.getItem(this.state.petitionID+".cifValue").then((value) => {
        if (value != null) {
          this.setState({ cifValue: value })
        }
      })
      await AsyncStorage.getItem(this.state.userid+".words").then((value) => {
        if (value != null) {
          this.setState({ words: JSON.parse(value) })
        }
      })
      await AsyncStorage.getItem(this.state.petitionID+".images").then((value) => {
        if (value != null) {
          this.setState({ images: JSON.parse(value) })
        }
      })
      await AsyncStorage.getItem(this.state.petitionType).then((value) => {
        if (value != null) {
          this.setState({ list: JSON.parse(value) })
        }
      })
    }
  
    componentWillUnmount() {
      Voice.destroy().then(Voice.removeAllListeners);
    }
  
    onSpeechStart(e) {
        this.setState({
          started: '√',
        });
      };
  
    onSpeechRecognized(e) {
        this.setState({
          recognized: '√',
        });
      };

    async showDateError() {
      await this.showAlert("Fecha errónea", "La fecha '" + this.state.listenedData + "' es incorrecta")
      this.updateListen(-1)
    }

    setFixedDate() {
      if (this.state.listenedData.toLowerCase() == "hoy") {
        this.setState({ interpretedData: ("0" + (new Date().getDate())).slice(-2)+ "-"+ ("0" + (new Date().getMonth() + 1)).slice(-2) + "-" + new Date().getFullYear() })
      } else if (this.state.listenedData.toLowerCase() == "ayer") {
        this.setState({ interpretedData: ("0" + (new Date().getDate()-1)).slice(-2)+ "-"+ ("0" + (new Date().getMonth() + 1)).slice(-2) + "-" + new Date().getFullYear() })
      } else {
        var daysL = ["Uno", "Dos", "Tres", "Cuatro", "Cinco", "Seis", "Siete", "Ocho", "Nueve", "Diez",
        "Once", "Doce", "Trece", "Catorce", "Quince", "Dieciséis", "Diecisiete", "Dieciocho", "Diecinueve",
        "Veinte", "Veintiuno", "Veintidós", "Veintitrés", "Veinticuatro", "Veinticinco", "Veintiséis", "Veintisiete",
        "Veintiocho", "Veintinueve", "Treinta", "Treinta y uno"]
        var daysN = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", 
        "11", "12", "13", "14", "15", "16", "17", "18", "19", "20",
        "21", "22", "23", "24", "25", "26", "27", "28", "29", "30", "31"]
        var months = [
          {name:"Enero",last:31}, 
          {name:"Febrero",last:28}, 
          {name:"Marzo",last:31}, 
          {name:"Abril",last:30}, 
          {name:"Mayo",last:31}, 
          {name:"Junio",last:30}, 
          {name:"Julio",last:31}, 
          {name:"Agosto",last:31}, 
          {name:"Septiembre",last:30}, 
          {name:"Octubre",last:31}, 
          {name:"Noviembre",last:30}, 
          {name:"Diciembre",last:31}]
          var indexL = daysL.findIndex((i) => this.state.listenedData.toLowerCase().includes(i.toLowerCase()))
          var indexN = daysN.findIndex((i) => this.state.listenedData.toLowerCase().includes(i.toLowerCase()))
          var indexM = months.findIndex((i) => this.state.listenedData.toLowerCase().includes(i.name.toLowerCase()))
          var aux = this.state.listenedData.split(" ")
          var day = ""
          daysN.forEach((i) => {
            if (i == aux[0]){
              day = i
            }
          })
        if (indexL > -1 && indexM > -1) {
          indexM++
          var d = ("0" + daysN[indexL]).slice(-2)
          var m = ("0" + indexM).slice(-2)
          this.setState({ interpretedData: d + "-" + m + "-" + new Date().getFullYear() })
        } else if (indexN > -1 && indexM > -1 && day != "") {
          indexM++
          var d = ("0" + day).slice(-2)
          var m = ("0" + indexM).slice(-2)
          if (months[indexM-1].last < day) {
            this.showDateError()
          } else {
            this.setState({ interpretedData: d + "-" + m + "-" + new Date().getFullYear() })
          }
        } else if (indexL > -1) {
          var d = ("0" + daysN[indexL]).slice(-2)
          if (d > new Date().getDate()) {
            this.setState({ interpretedData: d + "-" + (("0" + (new Date().getMonth())).slice(-2)) + "-" + new Date().getFullYear() })
          } else {
            this.setState({ interpretedData: d + "-" + (("0" + (new Date().getMonth() + 1)).slice(-2)) + "-" + new Date().getFullYear() })
          }
        } else if (indexN > -1 && day != "") {
          var d = ("0" + day).slice(-2)
          if (d > new Date().getDate()) {
            this.setState({ interpretedData: d + "-" + (("0" + (new Date().getMonth())).slice(-2)) + "-" + new Date().getFullYear() })
          } else {
            this.setState({ interpretedData: d + "-" + (("0" + (new Date().getMonth() + 1)).slice(-2)) + "-" + new Date().getFullYear() })
          }
        } else {
          this.showDateError()
        }
      }
      this.resetListening()
    }

    async setFixedNumber() {
      if (this.state.listenedData.includes("con")) this.setState({ listenedData: this.state.listenedData.replace("con", ".")})
      var number = evaluate(this.state.listenedData);
      if (number==0) {
        if (isNaN(this.state.listenedData)) {
          this.showAlert("Error", "El dato aportado no es numérico")
          this.setState({ getData: false })
        } else {
          if (!this.state.savedData[this.state.listenFlag].idcampo.includes("porcentaje") && (!this.state.listenedData.includes(".") || !this.state.listenedData.includes(","))) {
            this.setState({ listenedData: this.state.listenedData + ",00" })
          }
          this.setState({ interpretedData: this.state.listenedData.split(' ').join("").replace("/",".") })
          this.resetListening()
        }
      } else {
        this.setState({ listenedData: number + "" })
        this.setState({ interpretedData: number + "" })
        this.resetListening()
      }
    }

    async saveCIF(cif){
      await this.setState({cifValue: cif})
      await AsyncStorage.setItem(this.state.petitionID+".cifValue", cif)
    }

    setFixedData() {
      var listenedData = this.state.listenedData.toLowerCase()
      var sameKeywords = this.state.words.findIndex(obj => obj.keywords.toLowerCase().includes(listenedData))
      var sameEntity = this.state.words.findIndex(obj => obj.entity.toLowerCase().includes(listenedData))
      if (sameKeywords > -1) {
        this.setState({ interpretedData: this.state.words[sameKeywords].entity })
        this.saveCIF(this.state.words[sameKeywords].cifValue)
      } else if (sameEntity > -1) {
        this.setState({ interpretedData: this.state.words[sameEntity].entity })
        this.saveCIF(this.state.words[sameEntity].cifValue)
      } else {
        this.setState({ interpretedData: this.state.listenedData })
      }
      this.resetListening()
    }

    async setListenedData() {
      if (this.state.savedData[this.state.listenFlag].tipoexp == "F") {
        this.setFixedDate()
      } else if (this.state.savedData[this.state.listenFlag].tipoexp == "N") {
        this.setFixedNumber()
      } else {
        this.setFixedData()
      }
    }
  
    onSpeechResults(e) {
      var res = e.value + ""
      var word = res.split(",")
      if (word[0].length>0) {
        this._stopRecognition(e)
      }
      this.setState({
        listenedData: word[0],
      });
      if (this.state.savedData[this.state.listenFlag].idcampo=="factura") {
        this.setState({listenedData:this.state.listenedData.toUpperCase()})
      }
      if (this.state.savedData[this.state.listenFlag].tipoexp == "E") {
        console.log("siiii")
        var sameKeywords = this.state.words.findIndex(item => item.keywords.toLowerCase().includes(this.state.listenedData.toLowerCase()))
        console.log("sameKeywords="+sameKeywords)
        if (sameKeywords>-1) {
          this.state.savedData[this.state.listenFlag].valor = this.state.words[sameKeywords].entity
          this.setState({ cif: this.state.words[sameKeywords].cifValue })
        } 
      }
      if (this.state.savedData[this.state.listenFlag].tipoexp != "1" && this.state.savedData[this.state.listenFlag].tipoexp != "E" && this.state.savedData[this.state.listenFlag].tipoexp != "F") {
        this.setState({listenedData:this.state.listenedData.split(' ').join("")})
      }
      this.setState({getData: true})
      this.setListenedData()
    }
  
    async _startRecognition(e) {
      this.setState({
        recognized: '',
        started: '',
        results: [],
      });
      var percentage = this.state.savedData.findIndex(obj => obj.idcampo.includes("porcentaje"))
      if (this.state.listenFlag<this.state.savedData.length) {
        this.setState({is_recording: true })
        var idcampo = this.state.data[this.state.listenFlag].idcampo
        if ((!idcampo.includes("base") && !idcampo.includes("cuota") && this.state.data[this.state.listenFlag].xdefecto == "") || 
        (idcampo.includes("base") && idcampo.includes("cuota") && this.state.data[this.state.listenFlag].xdefecto != "")) {
          try {
            await Voice.start('es');
            this.setTimer(e)
          } catch (e) {
            console.error(e);
          }
        } else {
          if (idcampo.includes("base") || idcampo.includes("cuota") && this.state.savedData[percentage].valor != "") {
            this.calculateResult()
          } else {
            this.setState({ interpretedData : this.state.data[this.state.listenFlag].xdefecto })
          }
        }
      }
    }

    async setTimer (e) {
      if (this.state.seconds > 0 ) {
        var timer = setTimeout(() => {
          this.setState({ seconds: this.state.seconds-1})
          this.setTimer(e)
        },1000);
      } else {
          this._stopRecognition(e)
          clearTimeout(this.state.timer)
      }
      this.setState({ timer: timer })
    }
  
    async _stopRecognition(e) {
      await this.setState({ is_recording: false })
      await this.setState({ seconds: 15 })
      clearTimeout(this.state.timer)
      try {
        await Voice.stop()
      } catch (e) {}
    }

    setMicrophoneIcon() {
      return (<View style={{ width: 70,textAlign:'center' }}><TouchableOpacity onPress={this._startRecognition.bind(this)}><Icon name='microphone' type='font-awesome' color='#1A5276' size={40} /></TouchableOpacity></View>)
    }

     takePhoto = async() =>{
        try {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.CAMERA, { title: "ContaVoz", message:"Necesitamos permisos para acceder a su cámara", buttonNegative: "Cancelar", buttonPositive: "Aceptar" }
          );
          if (granted === PermissionsAndroid.RESULTS.GRANTED) {
            let options = {
              title: 'Hacer una foto',
              quality: 0.5,
              aspect:[4,3],
              customButtons: [ { name: 'customOptionKey', title: 'Choose Photo from Custom Option' }, ],
              storageOptions: {
                skipBackup: true,
                path: 'images',
                privateDirectory: true,
              },
              includeBase64: true
            };
            if (this.state.images.length <= 9) {
              ImagePicker.launchCamera(options, (response) => {
                if (response.didCancel || response.error || response.customButton) {
                } else {
                  var arrayImages = this.state.images
                  var uri = JSON.stringify(response.assets[0]["uri"])
                  var urid = "1o4klNg4jXvJSOQ4_VAFKSFsUPOKWoMBR"//JSON.stringify(response.assets[0]["base64"])
                  var newID = this.state.petitionID+"_"+(this.state.images.length+1)
                  arrayImages.push({
                    id: newID,
                    nombre: newID,
                    id_drive:'1qdFovzRbbT2rBKm2WdOMEXmO5quFHDgX',
                    urid: urid,
                    uri: uri.replace(/['"]+/g, '')
                  })
                  this.setState({images: arrayImages})
                  this.saveImages()
                }
              })
            } else {
              this.showAlert("Error", "Solo puede adjuntar 10 imágenes")
            }
          }
        } catch (err) {}
    }
  
    async saveImages() {
      console.log("saveImages")
      var list = []
      await AsyncStorage.getItem(this.state.petitionType).then((value) => {
        if (value != null) {
          list = JSON.parse(value) 
        }
      })
      var index = list.findIndex(obj => JSON.stringify(obj.id) == this.state.petitionID)
      list[index].images = this.state.images
      await AsyncStorage.setItem(this.state.petitionType, JSON.stringify(list))
      await AsyncStorage.setItem(this.state.petitionID+".images", JSON.stringify(this.state.images))
    }

    async saveInMemory(key, value) {
      await AsyncStorage.setItem(key, value)
    }
  
    goGallery = async() =>{
      let options = {
        title: 'Foto desde la galería',
        customButtons: [
          { name: 'customOptionKey', title: 'Choose Photo from Custom Option' },
        ],
        includeBase64: true,
        storageOptions: {
          skipBackup: true,
          path: 'images',
        },
      };
      if (this.state.images.length <= 9) {
        ImagePicker.launchImageLibrary(options, (response) => {
          if (response.didCancel || response.error || response.customButton) {
          } else {
            var arrayImages = this.state.images
            var uri = JSON.stringify(response.assets[0]["uri"])
            var urid = "1o4klNg4jXvJSOQ4_VAFKSFsUPOKWoMBR"//JSON.stringify(response.assets[0]["base64"])
            var newID = this.state.petitionID+"_"+(this.state.images.length+1)
            arrayImages.push({
              id: newID,
              nombre: newID,
              id_drive:'1qdFovzRbbT2rBKm2WdOMEXmO5quFHDgX',
              urid: urid,
              uri: uri.replace(/['"]+/g, '')
            })
            this.setState({images: arrayImages})
            this.saveImages()
          }
        })
      } else {
        this.showAlert("Error", "Solo puede adjuntar 10 imágenes")
      }
    }
  
      async showAlert (title, message) {
        const AsyncAlert = () => new Promise((resolve) => {
          Alert.alert(
            title,
            message,
            [
              {
                text: 'Ok',
                onPress: () => {
                  resolve();
                },
              },
            ],
            { cancelable: false },
          );
          });
        await AsyncAlert();
      }

    async setFlag(i) {
      this.setState({flag: i })
    }
  
    setAllFlags() {
      if (this.state.images.length<=1) return null
      var result = []
      for (let i = 0; i < this.state.images.length; i++) {
        if (this.state.flag == i) {
          result.push(<View style={styles.roundButtonsView}><Text style={styles.focusRoundButton}></Text></View>)
        } else {
          result.push(<View style={styles.roundButtonsView}>
            <TouchableOpacity onPress={() => this.setFlag(i)}>
              <Text style={styles.roundButton}></Text>
            </TouchableOpacity>
            </View>)
        }
      }
      return (<View style={styles.flatlistView}>{result}</View>)
    }
  
    seeImage (image) {
      this.props.navigation.push('ImageViewer', {image: image,back: "Petition"})
    }
  
    setImageZoom() {
      return (<ImageZoom
          cropWidth={Dimensions.get('window').width}
          cropHeight={Dimensions.get('window').height/2}
          imageWidth={Dimensions.get('window').width}
          imageHeight={Dimensions.get('window').height/2}>
            <TouchableOpacity onPress={() => this.seeImage(this.state.images[this.state.flag])}>
            <Image
              source={{
                uri: this.state.images[this.state.flag].uri,
              }}
              resizeMode="cover"
              key={this.state.flag}
              style={{ width: Dimensions.get('window').width, height: (Dimensions.get('window').height)/2 }}
            />
            </TouchableOpacity>
        </ImageZoom>)
    }            
  
    setImages() {
      if (this.state.images.length > 0) {
        return (
          <View style={styles.imagesSection}>
            <View style={styles.selectedImageView}>
            {this.setImageZoom()}
          </View>
          </View>
        )}
      return (
        <View style={styles.imagesSection}>
        <Text style={styles.transcript}></Text>
        <Image source={require('./assets/no-photo.png')} resizeMode="contain" key="0" style={{ width: 150, height: 150 }} />
        </View>
      )
    }

    fadeIn = () => {
      Animated.timing(this.state.fadeAnimation, {
        useNativeDriver: true,
        toValue: 1,
        duration: 500
      }).start(({ finished }) => {
        if (finished) {
          this.fadeOut()
        }
      })
    }
  
    fadeOut = () => {
      Animated.timing(this.state.fadeAnimation, {
        useNativeDriver: true,
        toValue: 0,
        duration: 500
      }).start(({ finished }) => {
        if (finished) {
          this.fadeIn()
        }
      })
    };

    setModalButtons(){
      return (<View style={styles.modalNavBarButtons}>
        {this.state.listenFlag==0 && (<View style={{paddingRight: 20}}><TouchableOpacity onPress={() => this.closeListen()} style={styles.saveButtomModal}><Icon name='times' type='font-awesome' color='white' size={32}/></TouchableOpacity></View>)}
        {this.state.listenFlag>0 && (<View style={{paddingRight: 20}}>
            <TouchableOpacity onPress={() => this.updateListen(-1)} style={styles.saveButtomModal}><Icon name='arrow-left' type='font-awesome' color='white' size={32}/></TouchableOpacity>
                </View>)}
                {this.state.listenFlag>0 && (
                <View>
                  <TouchableOpacity onPress={() => this.editListen(-1)} style={styles.editButtomModal}><Icon name='pencil' type='font-awesome' color='white' size={32}/></TouchableOpacity>
                </View>)}
                {this.state.listenFlag < this.state.savedData.length-1 && (
                <View style={{paddingLeft: 20}}><TouchableOpacity onPress={() => this.updateListen(1)} style={styles.exitButtomModal}><Icon name='arrow-right' type='font-awesome' color='white' size={32}/></TouchableOpacity></View>)}
              </View>)
    }

    setVoiceControlView() {
      var lastSaved = Number(this.state.listenFlag)
      this.fadeIn()
      return (<View style={styles.titleView}>
          {lastSaved>0 && lastSaved <= this.state.savedData.length-1 && this.state.savedData[lastSaved-1].valor != null && <Text style={styles.showNextData}>Último dato {this.state.savedData[lastSaved-1].titulo}: {this.state.savedData[lastSaved-1].valor}</Text>}
          <Animated.View style={[ { opacity: this.state.fadeAnimation, width:"90%" }]}>
            <Text style={styles.showListen}>Escuchando {this.state.savedData[lastSaved].titulo.toLowerCase()}</Text>
          </Animated.View>
          <Text style={styles.secondsLabel}>Quedan {this.state.seconds} segundos</Text>
          {lastSaved>-1 && lastSaved <= this.state.savedData.length-2 && <Text style={styles.showNextData}>Siguiente dato {this.state.data[lastSaved+1].titulo}</Text>}
          <Text style={styles.transcript}></Text>
            {this.setModalButtons()}
      </View>)
    }

    async editListen() {
      await this.setState({ listenFlag: this.state.listenFlag - 1 })
      if (this.state.savedData[this.state.listenFlag].escuchado.length>0) {
        this.setState({ showResult: true })
        this._stopRecognition(this)
        this.setState({ is_recording: false })
      }
    }

    async closeListen() {
      this._stopRecognition(this)
      this.setState({ is_recording: false })
    }

    async updateListen(value) {
      var lng = this.state.savedData.length-1
      if (this.state.listenFlag <= lng) {
        this.setState({ listenFlag: Number(this.state.listenFlag) + Number(value)})
        await AsyncStorage.setItem(this.state.petitionID+".listenFlag", JSON.stringify(this.state.listenFlag))
        if (this.state.savedData[this.state.listenFlag].idcampo.includes("base") || this.state.savedData[this.state.listenFlag].idcampo.includes("cuota")) {
          this.calculateResult()
        }
        this.setState({ seconds: 10 })
        this._stopRecognition(this)
        this._startRecognition(this) 
        this.setState({interpretedData:""})
      } else {
        this._stopRecognition(this)
        this.setState({ is_recording: false})
      }
    }

    setVoiceControl() {
      if (JSON.parse(this.state.is_recording) && this.state.listenFlag>0 && this.state.listenFlag<this.state.savedData.length && (this.state.savedData[this.state.listenFlag].xdefecto != "")) {
        return this.setDefaultDataModal("Valor por defecto")
      } else if (JSON.parse(this.state.is_recording) && this.state.listenFlag>0 && this.state.listenFlag<this.state.savedData.length && (this.state.savedData[this.state.listenFlag].idcampo.includes("base") || 
      this.state.savedData[this.state.listenFlag].idcampo.includes("cuota"))) {
        return this.setDefaultDataModal("Resultado obtenido")
      } else if (JSON.parse(this.state.is_recording & this.state.listenFlag>=0 && this.state.listenFlag<=this.state.savedData.length-1)) {
        return this.setVoiceControlView()
      }
      return null
    }

    async saveEnterprise() {
      var sameKeywords = this.state.words.findIndex(item => item.keywords.toLowerCase().includes(this.state.savedData[this.state.listenFlag].escuchado.toLowerCase()))
      if (sameKeywords>-1) {
        console.log("1")
        this.state.savedData[this.state.listenFlag].valor = this.state.words[sameKeywords].entity
        await this.setState({ cif: this.state.words[sameKeywords].cifValue })
      } else {
        console.log("2")
        this.state.words.push({
          keywords: this.state.savedData[this.state.listenFlag].escuchado,
          entity: this.state.interpretedData,
          cifValue: this.state.cifValue,
          time: new Date().getTime()
        })
        this.state.savedData[this.state.listenFlag].valor = this.state.interpretedData
      }
      await this.setState({savedData: this.state.savedData})
      await AsyncStorage.setItem(this.state.userid+".savedData", JSON.stringify(this.state.savedData))
      await this.setState({ words: this.state.words })
      await AsyncStorage.setItem(this.state.userid+".words", JSON.stringify(this.state.words))
      this.setState({showResult: false})
      this.updateListen(1)
      console.log("Diccionario\n:"+JSON.stringify(this.state.words))

      
      //this.state.words[sameKeywords]

      /*if (this.state.interpretedData=="") {
        await this.setState({ interpretedData: this.state.savedData[this.state.listenFlag].valor })
      }
      var thereIsEntity = this.state.words.findIndex(item => item.entity.toLowerCase() === this.state.interpretedData.toLowerCase())
      var thereIsCIF = this.state.words.findIndex(item => item.cifValue.toLowerCase() === this.state.cifValue.toLowerCase())
      console.log("thereIsEntity:"+thereIsEntity +  " and thereIsCIF:" + thereIsCIF)
      
      if (thereIsEntity==-1 && thereIsCIF==-1) {
        console.log("1")
        this.state.words.push({
          keywords: this.state.savedData[this.state.listenFlag].escuchado,
          entity: this.state.interpretedData,
          cifValue: this.state.cifValue,
          time: new Date().getTime()
        })
        this.state.savedData[this.state.listenFlag].valor = this.state.interpretedData
        await AsyncStorage.setItem(this.state.userid+".savedData", JSON.stringify(this.state.savedData))
        
      } else if (thereIsEntity==-1 && thereIsCIF>-1) {
        console.log("2")
        this.state.words[thereIsCIF].entity = this.state.interpretedData
        this.state.words[thereIsCIF].cifValue = this.state.cifValue
        this.state.savedData[this.state.listenFlag].valor = this.state.interpretedData
      } else {
        console.log("3")
        this.state.words[thereIsEntity].entity = this.state.interpretedData
        this.state.words[thereIsEntity].cifValue = this.state.cifValue
        this.state.savedData[this.state.listenFlag].valor = this.state.interpretedData
      }
      this.setState({savedData: this.state.savedData})
      await AsyncStorage.setItem(this.state.userid+".savedData", JSON.stringify(this.state.savedData))
      this.setState({ words: this.state.words })
      await AsyncStorage.setItem(this.state.userid+".words", JSON.stringify(this.state.words))
      await AsyncStorage.setItem(this.state.petitionID+".cifValue", this.state.cifValue)
      this.setState({showResult: false})
      this.updateListen(1)
      this.setState({is_recording: true})
      console.log("Diccionario\n:"+JSON.stringify(this.state.words))*/
    }

    async resetListening() {
      this.state.savedData[this.state.listenFlag].escuchado = this.state.listenedData
      this.state.savedData[this.state.listenFlag].valor = this.state.interpretedData
      this.setState({savedData: this.state.savedData})
      await AsyncStorage.setItem(this.state.petitionID+".savedData", JSON.stringify(this.state.savedData))
      this.setState({ listenedData: "" })
      this.setState({ interpretedData: "" })
      if (this.state.listenFlag<this.state.savedData.length-1) {
        this.setState({ is_recording: true })
        this.updateListen(1)
      }
      this.saveDocument()
    }

    async dataOK() {
      if (this.state.cifValue.length==0 && this.state.savedData[this.state.listenFlag].tipoexp == "E") {
        this.showAlert("Error", "Indique un CIF para esta empresa")
      } else if (this.state.savedData[this.state.listenFlag].tipoexp == "E") {
        this.saveEnterprise()
      } else {
        if (this.state.interpretedData.length>0) {
          this.state.savedData[this.state.listenFlag].valor = this.state.interpretedData
          this.setState({savedData: this.state.savedData})
          await AsyncStorage.setItem(this.state.petitionID+".savedData", JSON.stringify(this.state.savedData))
        }
        this.setState({showResult: false})
        this.updateListen(1)
        this.setState({is_recording: true})
      }
    }

    async calculateResult() {
      var porcentaje =  this.state.savedData[this.state.listenFlag-1].valor
      var index = this.state.savedData.findIndex(obj => obj.idcampo.includes("importe"))
      var importe = this.state.savedData[index].valor
      if (importe == null) {
        await this.showAlert("Error", "Debe indicar un importe para proceder a calcular base y cuota")
        var newIndex=Number(this.state.listenFlag)-Number(index)
        this.updateListen(-newIndex)
      } else if (porcentaje == null) {
        await this.showAlert("Error", "Debe indicar un porcentaje para proceder a calcular base y cuota")
        var newIndex=Number(this.state.listenFlag)-Number(this.state.listenFlag-1)
        this.updateListen(-newIndex)
      } else {
        if (importe.includes(",")) {
          importe = importe.replace(",",".")
        }
        var result = ""
        if (this.state.savedData[this.state.listenFlag].idcampo.includes("base")) {
          var x = 100 + Number(porcentaje)
          result = ( importe * 100 ) / x
          result = Math.round(result * 100) / 100
        } else {
          var base = Number(this.state.savedData[this.state.listenFlag-1].valor) 
          var porcentaje = Number(this.state.savedData[this.state.listenFlag-2].valor) 
          result = base*porcentaje
          result = Math.round(result * 100) / 100
        }
        this.state.savedData[this.state.listenFlag].escuchado = result
        this.state.savedData[this.state.listenFlag].valor = result
        await this.setState({interpretedData: JSON.stringify(this.state.interpretedData)})
        await AsyncStorage.setItem(this.state.petitionID+".savedData", JSON.stringify(this.state.savedData))
      }
    }

    setDefaultModalButtons() {
      return (<View style={styles.modalNavBarButtons}>
        {this.state.listenFlag==0 && (<View style={{paddingRight: 20}}><TouchableOpacity onPress={() => this.closeListen()} style={styles.saveButtomModal}><Icon name='times' type='font-awesome' color='white' size={32}/></TouchableOpacity></View>)}
        {this.state.listenFlag>0 && (<View style={{paddingRight: 20}}>
            <TouchableOpacity onPress={() => this.updateListen(-1)} style={styles.saveButtomModal}><Icon name='arrow-left' type='font-awesome' color='white' size={32}/></TouchableOpacity>
                </View>)}
                {this.state.listenFlag>0 && (
                <View>
                  <TouchableOpacity onPress={() => this.dataOK(-1)} style={styles.editButtomModal}><Icon name='check' type='font-awesome' color='white' size={32}/></TouchableOpacity>
                </View>)}
                {this.state.listenFlag < this.state.savedData.length-1 && (
                <View style={{paddingLeft: 20}}><TouchableOpacity onPress={() => this.updateListen(1)} style={styles.exitButtomModal}><Icon name='arrow-right' type='font-awesome' color='white' size={32}/></TouchableOpacity></View>)}
              </View>)
    }

    setDefaultDataModal(message) {
      if (this.state.savedData[this.state.listenFlag].valor == null) return null
      return (<Modal
          animationType = {"slide"}
          transparent={true}>
            <View style={styles.centeredView}>
            <View style={styles.modalView}>
            <Text style={styles.showTitle}>{this.state.savedData[this.state.listenFlag].titulo}</Text>
            <View style={styles.modalResult}>
              <Text style={styles.resumeText}>{message}</Text>
              <TextInput blurOnSubmit={true} multiline={true} style={styles.changeTranscript} onChangeText={interpretedData => this.setState({interpretedData: interpretedData})}>{this.state.savedData[this.state.listenFlag].valor}</TextInput>
            </View>
              <Text style={styles.transcript}></Text>
              {this.setDefaultModalButtons()}
          </View>
        </View>
      </Modal>)
    }

    setDataModal() {
      if (this.state.savedData.length==0) return null
      if (!this.state.showResult) return null
      return(<Modal
          animationType = {"slide"}
          transparent={true}>
            <View style={styles.centeredView}>
            <View style={styles.modalView}>
            <Text style={styles.listening}>{this.state.savedData[this.state.listenFlag].titulo}</Text>
            <View style={styles.modalResult}>
              <Text style={styles.resumeText}>Texto escuchado</Text>
              <Text multiline={true} style={styles.transcript}>{this.state.savedData[this.state.listenFlag].escuchado}</Text>
              <Text style={styles.resumeText}>Texto interpretado</Text>
              <TextInput blurOnSubmit={true} multiline={true} style={styles.changeTranscript} onChangeText={interpretedData => this.setState({interpretedData})}>{this.state.savedData[this.state.listenFlag].valor}</TextInput>
              {this.state.savedData[this.state.listenFlag].tipoexp=="E" &&
              (<View><Text style={styles.resumeText}>CIF de la empresa</Text>
                <TextInput blurOnSubmit={true} multiline={true} placeholder="CIF no registrado" style={styles.changeTranscript} onChangeText={cifValue => this.setState({cifValue})}>{this.state.cifValue}</TextInput>
              </View>)}
              </View>
              <Text style={styles.transcript}></Text>
              <View style={styles.modalNavBarButtons}>
                <TouchableOpacity onPress={() => this.dataOK()} style={styles.exitButtomModal}><Icon name='check' type='font-awesome' color='white' size={32}/></TouchableOpacity>
              </View>
          </View>
        </View>
      </Modal>)
    }

    showMessage = (message) => {
      if (!this.state.is_recording) {
        return(
          <View style={styles.titleView}>
            <Text style={styles.showTitle}>{message}</Text>
          </View>
        )
      }
      return null
    }
  
    async saveDocument() {
      var list = []
      await AsyncStorage.getItem(this.state.petitionType).then((value) => {
        if (value != null) {
          list = JSON.parse(value) 
        }
      })
      var index = list.findIndex(obj => JSON.stringify(obj.id) == this.state.petitionID)
      list[index].savedData = this.state.savedData
      await AsyncStorage.setItem(this.state.petitionType, JSON.stringify(list))
    }

    documentState = () => {
      var firstEmpty = this.state.savedData.findIndex(obj => obj.escuchado == "" && obj.valor == null)
      var lastSaved = this.state.savedData.findIndex(obj => obj.escuchado != "" && obj.valor != null)
      if (lastSaved == -1) {
        return this.showMessage("Adjunte imágenes o pulse el micrófono de voz")
      }
      if (firstEmpty>-1) {
        return this.showMessage("Documento de voz no finalizado")
      }
      if (firstEmpty==-1) {
        return this.showMessage("Documento de voz finalizado")
      }
      return null
    }
  
    seeDocument = () => {
      this.state.images.length > 0 && (this.state.savedData.length == 0 || (this.state.data.length==this.state.savedData.length))
      this.props.navigation.push('ResumeView')
    }

    async deleteDoc() {
      var chargeDocs = []
      this.state.list.forEach((i) => {
        if (i.id != this.state.petitionID) {
          chargeDocs.push(i)
        }
      })
      await AsyncStorage.setItem(this.state.petitionType, JSON.stringify(chargeDocs))
      this.goBack()
    }
  
    askDeleteDoc = async () => {
      const AsyncAlert = () => new Promise((resolve) => {
        Alert.alert(
          "Borrar documento",
          "¿Está seguro que desea borrar permanentemente este documento?",
          [
            {
              text: 'Sí',
              onPress: () => {
                resolve(this.deleteDoc());
              },
            },
            {
              text: 'No',
              onPress: () => {
                resolve(resolve("No"));
              },
            },
          ],
          { cancelable: false },
        );
        });
        await AsyncAlert();
    }

    setMenu() {
        if (this.state.is_recording) return null
        return (
        <View style={styles.navBarBackHeader}>
            <View style={{ width: 70,textAlign:'center' }}>
              <TouchableOpacity onPress={() => this.askDeleteDoc()}>
              <Icon
                name='trash'
                type='font-awesome'
                color="#B03A2E"
                size={40}
              />
              </TouchableOpacity>
            </View>
            <View style={{ width: 70,textAlign:'center' }}>
            <TouchableOpacity onPress={() => this.takePhoto()}>
              <Icon
                name='camera'
                type='font-awesome'
                color='#1A5276'
                size={40}
              />
              </TouchableOpacity>
              </View>
              {this.setMicrophoneIcon()}
              <View style={{ width: 70,textAlign:'center' }}>
              <TouchableOpacity onPress={() => this.goGallery()}>
              <Icon
                name='image'
                type='font-awesome'
                color='#1A5276'
                size={40}
              />
              </TouchableOpacity>
              </View>
            {(this.state.images.length > 0 || this.state.listenFlag >0) &&
            (<View style={{ width: 70,textAlign:'center' }}>
              <TouchableOpacity onPress={() => this.seeDocument()}>
              <Icon
                name='check-square'
                type='font-awesome'
                color='#5C9E7B'
                size={40}
              />
              </TouchableOpacity>
            </View>)}
          </View>
        )
    }

    render () {
      if (this.state.savedData.length==0) return null // Wait loop
      return (
        <View style={{flex: 1 }}>
            <View style={styles.navBarHeader}>
              <Text style={styles.mainHeader}>{this.state.title}</Text>
            </View>
            <ScrollView
              style={{backgroundColor: "white" }}
              showsVerticalScrollIndicator ={false}
              showsHorizontalScrollIndicator={false}
              persistentScrollbar={false}
              >
              <View style={styles.sections}>
                {this.setImages()}
                {this.setAllFlags()}
                {this.documentState()}
                {this.setVoiceControl()}
                {this.setDataModal()}
              </View>
            </ScrollView>
          {this.setMenu()}
        </View>
      );
    }
  }

  export default createAppContainer(PetitionScreen);

  const styles = StyleSheet.create({
      navBarHeader: {
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor:"#1A5276", 
        flexDirection:'row', 
        textAlignVertical: 'center',
      },
      navBarBackHeader: {
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor:"white", 
        flexDirection:'row', 
        textAlignVertical: 'center',
        height: 65
      },
      navBarButtons: {
        flex:1,
        backgroundColor:"#FFF", 
        paddingBottom: 50,
        flexDirection:'row',
        alignSelf: 'center',
      },
      modalNavBarButtons: {
        backgroundColor:"#FFF", 
        flexDirection:'row',
        alignSelf: 'center',
        paddingBottom: 20,
        paddingTop: 20
      },
      exitText: {
        fontSize: 17,
        textAlign: "center",
        color: "#fff",
        backgroundColor: "#B03A2E",
        fontWeight: 'bold',
        paddingTop: 10,
        paddingBottom: 10,
        paddingLeft: 20,
        paddingRight: 20,
        borderRadius: 10,
      },
      saveText: {
        fontSize: 17,
        textAlign: "center",
        fontWeight: 'bold',
        color: "#fff",
        backgroundColor: "#2E8B57",
        fontWeight: 'bold',
        paddingTop: 10,
        paddingBottom: 10,
        paddingLeft: 20,
        paddingRight: 20,
        borderRadius: 10,
      },
      roundButtonsView: {
        paddingLeft:7,
        paddingRight:7,
        paddingBottom: 5,
      },
      flatlistView: {
        paddingTop:20, 
        backgroundColor:"#FFF", 
        flexDirection: "row", 
        justifyContent: 'center',
      },
      listening: {
        textAlign: 'center',
        color: '#1B5E8B',
        fontWeight: 'bold',
        fontSize: RFPercentage(4),
      },
      showTitle:{
        paddingTop: 20,
        textAlign: 'center',
        color: '#154360',
        fontWeight: 'bold',
        fontSize: RFPercentage(3),
        width: "100%",
        paddingBottom: 10,
      },
      showListen:{
        textAlign: 'center',
        color: '#154360',
        fontWeight: 'bold',
        fontSize: RFPercentage(4),
        width: "100%",
        paddingBottom: 20,
        paddingTop: 20,
      },
      showSubTitle: {
        textAlign: 'center',
        color: 'black',
        fontWeight: 'bold',
        fontSize: RFPercentage(3),
        width: "100%",
        paddingTop: 10
      },
      showNextData: {
        textAlign: 'center',
        color: '#56A494',
        fontSize: RFPercentage(2.5),
        width: "100%",
        paddingTop: 20,
        fontWeight: 'bold',
      },
      centeredView: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      },
      modalResult: {
        width:"100%"
      },
      modalView: {
        margin: 20,
        backgroundColor: "white",
        borderRadius: 20,
        padding: 20,
        shadowColor: "#000",
        shadowOffset: {
          width: 0,
          height: 2
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 10,
        width:"90%",
        alignItems:"center",
        alignContent: "center",
        textAlign:"center"
      },
      footBar: {
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor:"#FFF", 
        flexDirection:'row', 
        textAlignVertical: 'center',
      },
      iconsView: {
        backgroundColor: "white",
        borderRadius: 10,
        paddingTop: 15,
        paddingLeft: 15,
        paddingRight: 15,
        paddingBottom: 15,
      },
      imagesSection: {
        flex: 1,
        alignItems: 'center',
        textAlign: "center",
        width:"100%",
      },
      selectedImageView: {
        flex: 1,
        alignItems: 'center',
        textAlign: "center",
        backgroundColor: "#000",
      },
      transcript: {
        color: '#000',
        fontSize: RFPercentage(2.5),
        textAlign: "center",
        width:"100%"
      },
      changeTranscript: {
        color: '#000',
        fontSize: RFPercentage(2.5),
        textAlign:"center",
        width:"100%",
        borderWidth: 0.5,
        borderColor: "lightgray",
        borderRadius: 20
      },
      resumeText: {
        fontSize: RFPercentage(3),
        textAlign: "center",
        paddingTop: 10,
        paddingBottom: 10,
        color: "#000",
        fontWeight: 'bold',
        width:"100%"
      },
      secondsLabel: {
        fontWeight: 'bold',
        color: "#B03A2E",
        fontSize: 20,
        textAlign: "center",
      },
      exitButton: {
        fontSize: 20,
        textAlign: "center",
        fontWeight: 'bold',
        color: "#B03A2E",
        fontWeight: 'bold',
      },
      skipButton: {
        width: "100%",
        fontSize: 20,
        paddingTop: 20,
        textAlign: "center",
        fontWeight: 'bold',
        color: "#761A1B",
        fontWeight: 'bold',
        fontStyle: 'italic',
      },
      saveNewValue: {
        fontSize: 20,
        textAlign: "left",
        color: "#2E8B57",
        fontWeight: 'bold',
      },
      saveButton: {
        fontSize: 20,
        textAlign: "center",
        fontWeight: 'bold',
        color: "#2E8B57",
        fontWeight: 'bold',
      },
      exitNewValue: {
        fontSize: 20,
        textAlign: "left",
        color: "#B03A2E",
        fontWeight: 'bold',
      },
      titleView: {
        paddingTop: 20,
        paddingBottom: 20,
        textAlign:"center",
        width:"80%",
        justifyContent: "center",
        alignItems: "center",
      },
      resumeView: {
        paddingBottom: 20,
        textAlign:"center",
        width:"100%",
        justifyContent: "center"
      },
      sections: {
        flex: 1,
        textAlign: "center",
        justifyContent: "center",
        width: "100%",
        alignItems: "center"
      },
      mainHeader: {
        padding: 10,
        alignItems: 'center',
        textAlign: "center",
        fontWeight: "bold",
        color: "#FFF",
        fontSize: 20,
      },
      roundButton: {
        width: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 6,
        borderRadius: 50,
        borderWidth:2,
        borderColor: '#1A5276',
      },
      focusRoundButton: {
        width: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 6,
        borderRadius: 50,
        backgroundColor: '#1A5276',
        borderWidth:2,
        borderColor: '#1A5276',
      },
      fadingContainer: {
        paddingVertical: 5,
        paddingHorizontal: 25,
        backgroundColor: "lightseagreen"
      },
      fadingText: {
        fontSize: 20,
        textAlign: "center",
        margin: 10,
        color : "#fff"
      },
      saveButtomModal: {
        backgroundColor: "#922B21",
        borderRadius: 10,
        padding: 10
      },
      exitButtomModal: {
        backgroundColor: "#509080",
        borderRadius: 10,
        padding: 10
      },
      editButtomModal: {
        backgroundColor: "#1B4F72",
        borderRadius: 10,
        padding: 10
      },
      continueButtomModal: {
        backgroundColor: "#2874A6",
        borderRadius: 10,
        padding: 10,
        flexDirection: "row"
      },
      clickImage: {
        padding: 10,
        backgroundColor: "white",
      },
      imagesCount: {
        fontWeight: "bold",
        fontSize: RFPercentage(3),
        color: "#154360"
      }
  })