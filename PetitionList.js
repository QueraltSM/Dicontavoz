import React, {Component} from 'react';
import {StyleSheet, Text, View, TouchableOpacity, FlatList, BackHandler, ScrollView, Alert } from 'react-native';
import { createAppContainer } from 'react-navigation';
import AsyncStorage from '@react-native-community/async-storage';
import { Icon } from 'react-native-elements'

class PetitionListScreen extends Component { 

    constructor(props) {
      super(props);
      this.state = {
        config: "",
        lists: [],
        type: ""
      }
      this.init()
    }

    async init() {
      await AsyncStorage.getItem("config").then((value) => {
        this.setState({ config: JSON.parse(value) })
      })
      await AsyncStorage.getItem("type").then((value) => {
        this.setState({ type: value })
      })
      var array = []
      for (let i = 0; i < this.state.config.length; i++) {
        await AsyncStorage.getItem(this.state.type+"."+i).then((value) => {
          if (value != null) {
            array.push(JSON.parse(value).length)
          } else {
            array.push(0)
          }
        })
      }
      this.setState({ lists: array })
    }
  
    componentDidMount(){
      BackHandler.addEventListener('hardwareBackPress', this.goBack);
    }
  
    goBack = () => {
      this.props.navigation.push("Main")
      return true
    }

    goView (view) {
      this.props.navigation.push(view)
    }

    saveLogout =  async (state) => {
      if (!state) {
        await AsyncStorage.setItem("isUserLoggedIn", JSON.stringify(false));
        await AsyncStorage.setItem("company", "");
        await AsyncStorage.setItem("user", "");
        await AsyncStorage.setItem("password", "");
      }
      this.goView("Login")
    }
  
    logout = async () => {
      const AsyncAlert = () => new Promise((resolve) => {
        Alert.alert(
          "Procedo a desconectar",
          "¿Debo mantener su identificación actual?",
          [
            {
              text: 'Sí',
              onPress: () => {
                resolve(this.saveLogout(true));
              },
            },
            {
              text: 'No',
              onPress: () => {
                resolve(this.saveLogout(false));
              },
            },
            {
              text: 'Cancelar',
              onPress: () => {
                resolve('Cancel');
              },
            },
          ],
          { cancelable: false },
        );
      });
      await AsyncAlert();
    }
    
    setMenuButtons() {
      return (
        <View style={{ width: "100%", flexDirection:'row', justifyContent:"center", paddingTop: 30, paddingBottom: 10}}>
            <TouchableOpacity onPress={() => this.goView("Main")}>
              <Icon
                name='home'
                type='font-awesome'
                color='black'
                size={32}
              />
            </TouchableOpacity>
            <Icon
              name='search'
              type='font-awesome'
              color='white'
              size={28}
            />
            <TouchableOpacity onPress={() => this.goView("DictionaryView")}>
              <Icon
                name='users'
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
            <TouchableOpacity onPress={() => this.logout()}>
              <Icon
                name='sign-out'
                type='font-awesome'
                color='black'
                size={32}
              />
            </TouchableOpacity>
        </View>)
    }
  
    openDocument = async (item, index) => {
      await AsyncStorage.setItem("petitionType", this.state.type+"."+index)
      await AsyncStorage.setItem("data", JSON.stringify(item))
      await AsyncStorage.setItem("historial", item.titulo)
      this.props.navigation.push("PetitionHistory")
    }

    setData (item, index) {
      return (<TouchableOpacity onPress={() => this.openDocument(item, index)}>
                <Text style={styles.registeredDocuments}>{this.state.lists[index]>0 && <Text style={styles.documentsCount}> {this.state.lists[index]} </Text>} {item.titulo}</Text>
              </TouchableOpacity>)
    }
    render () {
      return (
        <View style={{flex: 1, backgroundColor:"#FFF" }}>
          <View style={styles.navBarBackHeader}>
            <Text style={styles.navBarHeader}>Seleccione tipo de documento</Text>
          </View>
          <ScrollView vertical style={{backgroundColor: "#FFF" }}>
          <View style={styles.sections}>
          {this.setMenuButtons()}
            <View style={styles.voiceControlView}>
            <FlatList 
              vertical
              showsVerticalScrollIndicator={false}
              data={ this.state.config } 
              renderItem={({ item, index }) => (
              (<View>
                {this.setData(item, index)}
              </View>))}
            />
          </View>
          </View>
          </ScrollView>   
        </View>
      );
    }
  }
  
  export default createAppContainer(PetitionListScreen);

  const styles = StyleSheet.create({
    voiceControlView: {
        flex: 1,
        backgroundColor: "#FFF",
        paddingTop: 10,
        alignContent: "center",
        alignSelf: "center",
        width: "90%",
      },
      registeredDocuments: {
        fontSize: 19,
        textAlign: "center",
        paddingTop: 20,
        color: "#1A5276",
        fontWeight: 'bold',
        paddingBottom: 15
      },
      showTitle:{
        textAlign: 'center',
        color: '#154360',
        fontWeight: 'bold',
        fontSize: 18,
        width: "90%",
        paddingBottom: 20,
      },
      navBarBackHeader: {
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor:"#1A5276", 
        flexDirection:'row', 
        textAlignVertical: 'center',
        height: 60
      },
      navBarHeader: {
        flex: 1,
        color: '#FFF',
        fontWeight: 'bold',
        fontSize: 20,
        textAlign: 'center'
      },
      sections: {
        flex: 1,
        backgroundColor:"#FFF",
      },
      resumeView: {
        paddingTop: 30,
        paddingLeft: 40,
        backgroundColor: "#FFF",
        paddingBottom: 100
      },
      documentsCount: {
        backgroundColor: "#1A5276",
        borderRadius: 20,
        color: "white"
      }
})