	// react libraries
	import React from 'react';

	// react-native libraries
	import {StyleSheet, View, ActivityIndicator, AsyncStorage} from 'react-native';

	// third-part libraries
	import firebase from 'firebase';
	import { NavigationActions } from 'react-navigation';
	import * as axios from 'axios';

	// component
	import { SignUpForm } from "../component";

	// common
	import { StatusBarComponent, HeaderComponent } from "../common";

	class SignUpPage extends React.Component {
		/**
		 * constructor
		 */
		constructor(props) {
			super(props);
			this.state = {
				email: '',
				password: '',
				errorMessage: '',
				loading: false,
				autoFocus: false,
				firstName: '',
				lastName: '',
				userToken: '',
			};
		}

		/**
		 * componentWillMount
		 *
		 * React life-cycle method initialize firebase app
		 * @return {void}
		 */
		componentWillMount() {
			if (firebase.apps.length === 0) {
				firebase.initializeApp({
					apiKey: "AIzaSyD0ZJS7tPUrOWkZEZQRXDLQfLRT2yxhKMM",
					authDomain: "moov-68c37.firebaseapp.com",
					databaseURL: "https://moov-68c37.firebaseio.com",
					projectId: "moov-68c37",
					storageBucket: "moov-68c37.appspot.com",
					messagingSenderId: "1050975255216"
				});
			}
		}

		/**
		 *
		 */
		onSubmitEditing = () => {
			console.log(this.state, 'I was called');
		};

		/**
		 * onSignuSuccess
		 *
		 * navigates to Moov Homepage
		 * @return {void}
		 */
		onFirebaseSuccess = () => {
			const { navigate } = this.props.navigation;
			firebase.auth().onAuthStateChanged((user) => {
				if (user) {
					if (user && user.emailVerified === false) {
						user.sendEmailVerification()
							.then(() => {
								this.setState({ loading: !this.state.loading });
								navigate('MoovPages');
							})
							.catch((error) => {
								this.setState({
									errorMessage: error.message,
									loading: !this.state.loading
								})
							})
					}
				}
			});
		};

		/**
		 * saveUserToServer
		 *
		 * Saves user using axios to the server
		 * @return {void}
		 */
		saveUserToServer = () => {
			this.setState({ loading: !this.state.loading });
			axios.post('https://moov-backend-staging.herokuapp.com/api/v1/signup',
				{
					"firstname": this.state.firstName,
					"lastname": this.state.lastName,
					"email": this.state.email,
					"user_type": "student",
				}
							)
				.then((response) => {
					this.signUpSuccess(response);
				})
				.catch((error) => {
					this.setState({ loading: !this.state.loading, errorMessage: error.response.data.data.message });
				});
		};


    /**
     * onLoginSuccess
     *
     * Navigates user to MoovPage
     * @return {void}
     */
    signUpSuccess (response) {
      AsyncStorage.setItem("token", response.data.data.token);
      this.setState({ userToken: response.data.data.token})
      this.createUserOnFirebase();
    };

    /**
		 * deleteUser
		 * 
		 * deletes already created user on the server
		 * @return {void}
     */
		deleteUser = () => {
      axios.delete(`https://moov-backend-staging.herokuapp.com/api/v1/user`, {
        headers: {
          'Authorization': `Bearer ${this.state.userToken}`,
          'Content-Type': 'application/json'
        },
        data: {
          "email": this.state.email
        }
      })
        .then((response) => {
          console.log(response);
          console.log('Success');
        })
        .catch((error) => {
          console.log(error.response);
          console.log('Failed');
        });
		};

		/**
		 * createUserOnFirebase
		 */
		createUserOnFirebase = () => {
			firebase.auth().createUserWithEmailAndPassword(this.state.email, this.state.password)
				.then(this.onFirebaseSuccess)
				.catch((error) => {
          this.deleteUser();
					this.setState({
						errorMessage: error.message,
						loading: !this.state.loading
					});
				})
		};

		/**
		 * onSubmit
		 */
		onSubmit = () => {
			if(this.validateFields()) {
				this.setState({ errorMessage: '' });
				this.saveUserToServer();
			}
		};

		/**
		 * validateFields
		 *
		 * validates user input fields
		 * @return {boolean}
		 */
		validateFields = () => {
			let hasNumber = /\d/;
			let pattern = /^\w+@[a-zA-Z_]+?\.[a-zA-Z]{2,3}$/;
			let format = /[ !@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/;

			if ( this.state.firstName === '') {
				this.setState({ errorMessage: 'First Name field cannot be empty' })
			} else if(format.test(this.state.firstName)){
				this.setState({ errorMessage: 'First Name field cannot special characters' })
			} else if(hasNumber.test(this.state.firstName)) {
				this.setState({ errorMessage: 'First Name field cannot contains numbers' })
			} else if ( this.state.lastName === '') {
				this.setState({ errorMessage: 'Last Name field cannot be empty' })
			} else if(format.test(this.state.lastName)){
				this.setState({ errorMessage: 'Last Name field cannot special characters' })
			} else if(hasNumber.test(this.state.lastName)) {
				this.setState({ errorMessage: 'Last Name field cannot contains numbers' })
			} else if ( this.state.email === '') {
				this.setState({ errorMessage: 'Email field cannot be empty' })
			} else if(this.state.email.match(pattern) === null) {
				this.setState({ errorMessage: 'Email address is badly formatted' })
			} else if ( this.state.password === '' ) {
				this.setState({ errorMessage: 'Password field cannot be empty' })
			} else if(this.state.password.length < 6) {
				this.setState({ errorMessage: 'Password cannot be less than 6 characters' })
			} else {
				return true
			}
		};

		render() {
			const { container, activityIndicator } = styles;
			const resetAction = NavigationActions.reset({
				index: 0,
				actions: [
					NavigationActions.navigate({routeName: 'LandingPage'})
				]
			});

			// activity indicator
			if (this.state.loading) {
				return (
					<View style={{flex: 1}}>
						<ActivityIndicator
							color = '#004a80'
							size = "large"
							style={activityIndicator}
						/>
					</View>
				);
			}

			return (
				<View>
					<StatusBarComponent />
					<HeaderComponent
						backgroundColor='#004a80'
						leftIconColor='#fff'
						rightIconColor='#fff'
						centerTextColor='#fff'
						headerText='New User'
						onLeftPress={() => { this.props.navigation.dispatch(resetAction); }}
						onRightPress={() => { const { navigate } = this.props.navigation; navigate('LoginPage'); }}
						iconName='sign-in'
						iconType='font-awesome'
					/>
					<View style={container}>
						<SignUpForm
							onSubmitEditing={this.onSubmitEditing}
							firstName={this.state.firstName}
							lastNameValue={this.state.lastName}
							emailValue={this.state.email}
							passwordValue={this.state.password}
							errorMessage={this.state.errorMessage}
							onChangeFirstNameText={firstName => this.setState({ firstName })}
							onChangeLastNameText={lastName => this.setState({ lastName })}
							onChangeEmailText={email => this.setState({ email })}
							onChangePasswordText={password => this.setState({ password })}
							onSubmit={() => this.onSubmit()}
							buttonIconName='md-person-add'
							buttonIconType='ionicon'
							buttonText='Sign Up'
							autoFocus2={this.state.autoFocus}
						/>
					</View>
				</View>
			);
		}
	}

	const styles = StyleSheet.create({
		container: {
			height: '100%',
			backgroundColor: '#fff',
			paddingTop: '5%'
		},
		activityIndicator: {
			flex: 1,
			justifyContent: 'center',
			alignItems: 'center',
			height: 200
		},
	});

	export { SignUpPage };
