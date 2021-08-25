import React, {Component} from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Alert, TextInput, BackHandler, FlatList, ScrollView } from 'react-native';
import { createAppContainer } from 'react-navigation';
import { Icon } from 'react-native-elements'
import AsyncStorage from '@react-native-community/async-storage';

class DictionaryViewScreen extends Component {
    constructor(props) {
      super(props);
      this.state = {
        userid: "",
        words: [],
        addListen: "",
        addKey: "",
        addValue: "",
        updateListen: undefined,
        updateKey: undefined,
        updateValue: undefined,
        showForm: false,
        showSeach: false,
        keyword: "",
        isSearching: true,
        message: "No hay entidades registradas"
      };
      this.init()
    }
  
    componentDidMount() {
      BackHandler.addEventListener('hardwareBackPress', this.goBack);
    }
  
    goBack = () => {
      this.props.navigation.push('Main')
      return true
    }

    async init() {
      await AsyncStorage.getItem("userid").then((value) => {
        this.setState({ userid: value })
      })
      await AsyncStorage.getItem(this.state.userid+".words").then((value) => {
        if (value != null) {
          this.setState({ words: JSON.parse(value).reverse() })
        }
      })
      if (this.state.words != null) {
        this.setState({isSearching: false})
      }
    }
  
    showAlert = (title, message) => {
      Alert.alert(
        title,
        message,
        [
          {
            text: "Ok",
            style: "cancel"
          },
        ],
        { cancelable: false }
      );
    }
  
    async pushArrayWords() {
      var arrayWords =  this.state.words
      if (!this.state.words.some(item => item.value.toLowerCase() === this.state.addValue.toLowerCase())) {
        arrayWords.push({
          listen: this.state.addListen,
          key: this.state.addKey,
          value: this.state.addValue,
          time: new Date().getTime()
        })
      } else {
        this.showAlert("Error", "Ya existe una empresa registrada con este NIF")
      }
      this.setState({ words: arrayWords })
      await AsyncStorage.setItem(this.state.userid+".words", JSON.stringify(arrayWords))
    }
  
    _searchWord = async () => {
      var filteredWords = []
      this.state.words.forEach(i => {
        if (i.listen.toLowerCase().includes(this.state.keyword.toLowerCase()) || i.key.toLowerCase().includes(this.state.keyword.toLowerCase()) || i.value.toLowerCase().includes(this.state.keyword.toLowerCase())) {
          filteredWords.push(i)
        }
      })
      this.setState({ words: filteredWords })
      this.setState({ keyword: "" })
      this.setState({ showForm: false })
      this.setState({ showSeach: false })
      this.setState({ message: "No hay entidades coincidentes" })
    }

    async updateWord(item, index) {
      var listen = this.state.updateListen
      var key = this.state.updateKey
      var value = this.state.updateValue
      var array = this.state.words
      if (listen == undefined) listen = array[index].listen
      if (key == undefined) key = array[index].key
      if (value == undefined) value = array[index].value
      if (item.listen == listen && item.key == key && item.value == value) {
        this.showAlert("Error", "No se ha modificado ningún dato")
      } else if (listen == "" || key=="" || value == "") {
        this.showAlert("Error", "Complete todos los campos")
      } else {
        array[index].key = key 
        array[index].listen = listen 
        array[index].value = value 
        this.setState({ words: array })
        await AsyncStorage.setItem(this.state.userid+".words", JSON.stringify(array))
        this.showAlert("Proceso completado", "Se han guardado los datos")
        this.setState({updateKey: undefined})
        this.setState({updateListen: undefined})
        this.setState({updateValue: undefined})
      }
    }

    _addWord = async () => {
      if (this.state.addListen == "" || this.state.addKey == "" || this.state.addValue == "") {
        this.showAlert("Error", "Complete todos los campos")
      } else {
        await this.pushArrayWords()
        this.setState({ addListen: "" })
        this.setState({ addKey: "" })
        this.setState({ addValue: "" })
        this.formAction()
      }
    }
  
    formAction = () => {
      this.setState({showForm: !this.state.showForm})
      if (!this.state.showForm) {
        this.setState({showSeach: this.state.showForm})
      }
    }

    searchAction = () => {
      this.setState({showSeach: !this.state.showSeach})
      if (!this.state.showSeach) {
        this.setState({showForm: this.state.showSeach})
      }
    }
  
    setAddWordBox() {
      if (this.state.showForm) {
        return (
          <View style={styles.dictionaryView}>
            <Text style={styles.resumeText}>Nombre jurídico de la entidad</Text>
            <TextInput blurOnSubmit={true} value={this.state.addKey} multiline={true} style={styles.changeTranscript} placeholder="Ej: Disoft Servicios Informáticos S.L." onChangeText={addKey => this.setState({addKey})}></TextInput>
            <View style={{flexDirection:"row", alignItems:"center"}}><Icon name='microphone' style={styles.resumeText} type='font-awesome' color='#000' size={20}/><Text style={styles.resumeText}> Denominación de la entidad</Text></View>
            <TextInput blurOnSubmit={true} value={this.state.addListen} multiline={true} style={styles.changeTranscript} placeholder="Ej: Fifo" onChangeText={addListen => this.setState({addListen})}></TextInput>
            <Text style={styles.resumeText}>NIF de la entidad</Text>
            <TextInput blurOnSubmit={true} value={this.state.addValue} multiline={true} style={styles.changeTranscript} placeholder="Ej: B35222249" onChangeText={addValue => this.setState({addValue})}></TextInput>
            <Text style={styles.transcript}></Text>
            <TouchableOpacity onPress={() => this._addWord()}><Text style={styles.saveNewValue}>Grabar</Text></TouchableOpacity>
            <Text style={styles.transcript}></Text>
          </View>)
      }
    }
  
    setMenu() {
      return(
        <View style={{backgroundColor:"#FFF"}}>
          <View style={styles.accountingViewShow}>
          <Icon
              name='briefcase'
              type='font-awesome'
              color='#000'
              size={45}
            />
            </View>
          <Text style={styles.mainHeader}>Entidades</Text>
        </View>
      )
    }

    async askDelete(item) {
      const AsyncAlert = () => new Promise((resolve) => {
        Alert.alert(
          "Eliminar palabra",
          "¿Desea eliminar esta palabra del diccionario definitivamente?",
          [
            {
              text: 'Sí',
              onPress: () => {
                resolve(this.deleteWord(item));
              },
            },
            {
              text: 'No',
              onPress: () => {
                resolve("No");
              },
            },
          ],
          { cancelable: false },
        );
        });
        await AsyncAlert();
      }
  
    deleteWord = async (item) => {
      var arrayWords = []
      for (let i = 0; i < this.state.words.length; i++) {
        if ( this.state.words[i].value != item.value) {
          arrayWords.push({
            listen: this.state.words[i].listen,
            key: this.state.words[i].key,
            value: this.state.words[i].value,
            time: this.state.words[i].time
          })
        }
      }
      this.setState({ words: arrayWords })
      await AsyncStorage.setItem(this.state.userid+".words", JSON.stringify(arrayWords))
    }

    setMenuButtons() {
      return (
        <View style={{ width: "100%", flexDirection:'row', justifyContent:"center", paddingTop: 30, paddingBottom: 10 }}>
            {this.state.showForm && <TouchableOpacity onPress={() => this.formAction()}>
              <Icon
                name='times'
                type='font-awesome'
                color='#B03A2E'
                size={28}
              />
            </TouchableOpacity>}
            {!this.state.showForm && <TouchableOpacity onPress={() => this.formAction()}>
            <Icon
              name='plus'
              type='font-awesome'
              color='black'
              size={28}
            />
          </TouchableOpacity>}
          <Icon
              name='search'
              type='font-awesome'
              color='white'
              size={28}
            />
          {!this.state.showSeach && <TouchableOpacity onPress={() => this.searchAction()}>
            <Icon
              name='search'
              type='font-awesome'
              color='black'
              size={27}
            />
          </TouchableOpacity>}
          {this.state.showSeach && <TouchableOpacity onPress={() => this.searchAction()}>
              <Icon
                name='times'
                type='font-awesome'
                color='#B03A2E'
                size={28}
              />
            </TouchableOpacity>}
            <Icon
              name='search'
              type='font-awesome'
              color='white'
              size={28}
            />
            <TouchableOpacity onPress={() => this.showAll()}>
              <Icon
                name='list-alt'
                type='font-awesome'
                color='black'
                size={28}
              />
            </TouchableOpacity>
            <Icon
              name='search'
              type='font-awesome'
              color='white'
              size={28}
            />
            <TouchableOpacity onPress={() => this.goHome()}>
              <Icon
                name='home'
                type='font-awesome'
                color='black'
                size={28}
              />
            </TouchableOpacity>
        </View>)
    }

    async showAll() {
      this.setState({ showSeach: false })
      this.setState({ showForm: false })
      this.props.navigation.push("DictionaryView")
    }

    goHome() {
      this.props.navigation.push("Main")
    }

    setSeachBox() {
      if (this.state.showSeach) {
        return (<View style={styles.dictionaryView}>
          <Text style = { styles.resumeText }>Buscar entidad</Text>
          <TextInput blurOnSubmit={true} multiline={true} style = { styles.changeTranscript } placeholder="Ej: Disoft" onChangeText={(keyword) => this.setState({keyword: keyword})}  
           value={this.state.keyword}/> 
          <Text style={styles.transcript}></Text>
            <TouchableOpacity onPress={() => this._searchWord()}>
              <Text style={styles.saveNewValue}>Filtrar</Text>
            </TouchableOpacity>
         </View>)
      }
    }

    setWords() {
      if (!this.state.isSearching && this.state.words.length > 0 && !this.state.showSeach && !this.state.showForm) {
        return (
          <View style={styles.resumeView}>
            <Text style={styles.showTitle}>Entidades registradas</Text>
            <Text style={styles.showSubTitle}>Si modifica datos pulse guardar</Text>
            <FlatList 
              vertical
              showsVerticalScrollIndicator={false}
              data={ this.state.words.sort((a,b) => a.key .toLowerCase() > b.key.toLowerCase()) } 
              renderItem={({ item, index }) => (
              <View style={{paddingBottom: 20}}>
              <View style={styles.wordsBox}>
              <Text style={styles.dictionaryKeys}>Nombre jurídico <Icon name='pencil' type='font-awesome' color='#000' size={20}/></Text> 
              <TextInput blurOnSubmit={true} multiline={true} style={styles.dictionaryValues} onChangeText={(updateKey) => this.setState({updateKey: updateKey})}>{item.key}</TextInput> 
              <Text style={styles.dictionaryKeys}>Denominación <Icon name='pencil' type='font-awesome' color='#000' size={20}/></Text> 
              <TextInput blurOnSubmit={true} multiline={true} style={styles.dictionaryValues} onChangeText={(updateListen) => this.state.updateListen=updateListen}>{item.listen}</TextInput> 
              <Text style={styles.dictionaryKeys}>NIF <Icon name='pencil' type='font-awesome' color='#000' size={20}/></Text> 
              <TextInput blurOnSubmit={true} multiline={true} style={styles.dictionaryValues} onChangeText={(updateValue) => this.setState({updateValue: updateValue})}>{item.value}</TextInput>    
              <View style={styles.delIcon}>
              <TouchableOpacity onPress={() => this.updateWord(item, index)}>
                <Icon
                  name='save'
                  type='font-awesome'
                  color="#148F77"
                  size={25}
                />
                </TouchableOpacity>
                <TouchableOpacity>
                  <Icon
                    name='trash'
                    type='font-awesome'
                    color='white'
                    size={25}
                  />
                </TouchableOpacity>          
                <TouchableOpacity onPress={() => this.askDelete(item)}>
                  <Icon
                    name='trash'
                    type='font-awesome'
                    color='#B03A2E'
                    size={25}
                  />
                </TouchableOpacity>
              </View>
              </View>
            </View>
          )}
        />
        </View>
        )
      } else if (!this.state.isSearching && !this.state.showSeach && !this.state.showForm) {
        return (<View style={styles.resumeView}>
          <Text style={styles.showTitle}>{this.state.message}</Text>
          </View>)
      }
      return null
    }
  
    render() {
      return (
        <View style={{flex: 1}}>
          <ScrollView style={{backgroundColor: "#fff"}}>
          {this.setMenu()}
          <View style={{paddingBottom: 50}}>
            {this.setMenuButtons()}
            {this.setAddWordBox()}
            {this.setSeachBox()}
            {this.setWords()}
          </View>
          </ScrollView>
        </View>
      );
    }
  }

  export default createAppContainer(DictionaryViewScreen);

  const styles = StyleSheet.create({
    resumeView: {
        paddingTop: 30,
        paddingLeft: 40,
        backgroundColor: "#FFF",
        paddingBottom: 100,
        width:"100%"
    },
    showTitle:{
        textAlign: 'center',
        color: '#154360',
        fontWeight: 'bold',
        fontSize: 20,
        width: "90%",
        paddingBottom: 20,
      },
      showSubTitle: {
        color: '#CD5C5C',
        fontWeight: 'bold',
        fontSize: 17,
        width: "90%",
        paddingBottom: 20,
        textAlign: 'center',
      },
      resumeText: {
        fontSize: 20,
        textAlign: "justify",
        paddingTop: 20,
        color: "#000",
        fontWeight: 'bold',
        paddingBottom: 5
      },
      changeTranscript: {
        color: '#000',
        fontSize: 20,
        fontStyle: 'italic',
        width: "90%",
        borderWidth: 1,
        borderColor: "#ECECEC",
        borderRadius: 20,
        paddingLeft: 10,
        paddingRight: 10
      },
      transcript: {
        color: '#000',
        fontSize: 20,
        width: "90%"
      },
      mainHeader: {
        paddingTop: 20,
        alignItems: 'center',
        textAlign: "center",
        fontWeight: "bold",
        color: "#000",
        fontSize: 25,
      },
      dictionaryView: {
        paddingLeft: 40,
        backgroundColor: "#FFF",
        width:"100%",
      },
      dictionaryKeys: {
        fontSize: 20,
        textAlign: "justify",
        paddingTop: 15,
        color: "#000",
        width:"90%",
        fontWeight: 'bold',
      },
      dictionaryValues: {
        fontSize: 20,
        textAlign: "justify",
        paddingTop: 15,
        color: "#000",
        width:"90%",
      },
      wordsBox: {
        borderWidth: 0.5,
        borderTopColor:"white",
        borderLeftColor:"white",
        borderRightColor:"white",
        borderBottomColor:"lightgray",
        width: "90%",
        paddingBottom: 10,
        paddingRight: 10,
        paddingLeft: 10,
      },
      delIcon: {
        paddingLeft: 10,
        paddingRight: 5,
        flexDirection: "row",
        backgroundColor:"#FFF", 
        justifyContent: 'flex-end',
      },
      accountingViewShow: {
        flexDirection: 'row',
        textAlign: "center",
        alignSelf: "center",
        paddingTop: 30,
      },
      saveNewValue: {
        fontSize: 17,
        textAlign: "left",
        color: "#2E8B57",
        fontWeight: 'bold',
      },
      formBox: {
        fontSize: 18,
        textAlign: "center",
        color:"#1A5276",
        fontWeight: 'bold'
      },
      searchBox:{
        width: "90%", 
        flexDirection:'row', 
        textAlign: 'center',
        paddingBottom: 30
      },
      searchButton:{
        width: "90%", 
        flexDirection:'row', 
        justifyContent: 'flex-end',
      }
  })