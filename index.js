const express = require('express');
const bp = require('body-parser');
const axios = require('axios');
const ejs = require('ejs');
var admin = require("firebase-admin");
const bcrypt = require('bcrypt');

const app = express();
app.use(bp.urlencoded({ extended: true }));
app.set('view Engine', 'ejs');

const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

var serviceAccount = require("./project-ajweather-firebase-adminsdk-6wqij-9b3392a42d.json");


initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

async function hashPassword(plaintextPassword) {
  const saltRounds = 10;
  try {
    const salt = await bcrypt.genSalt(saltRounds);
    const hash = await bcrypt.hash(plaintextPassword, salt);
    return hash;
  } catch (error) {
    throw error;
  }
}

app.get('/', (req, res) => {
  res.render('signup.ejs', {
    error: ""
  });
});

app.get('/directlogin', (req, res) => {
  res.render('login.ejs',{
    error:""
  })
})






app.post('/signupsubmit', async (req, res) => {
  const email = req.body.email;
  const pass1 = req.body.password1;
  const pass2 = req.body.password2;

  console.log(pass1, email);

  
  const docs = await db.collection('capweather').where('email', '==', email).get();

  if (docs.size > 0) {
    console.log("Email is already exist!")
    return res.render('signup.ejs', {
      error: "This email is already exist!"
    });
    
  } else {
    if (pass1 === pass2) {
      try {
      
        const hashedPassword = await hashPassword(pass1);

       
        await db.collection('capweather').add({
          email: email,
          password: hashedPassword 
        });

        console.log("Signup success");
        return res.render('login.ejs', {
          error: ""
        });
      } catch (error) {
        console.error("Error hashing password:", error);
        return res.render('signup.ejs', {
          error: "An error occurred during signup."
        });
      }
    } else {
      console.log("Signup Invalid");
      return res.render('signup.ejs', {
        error: "Passwords do not match"
      });
    }
  }
});




var id="";
app.post('/loginsubmit', async (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  console.log(email, password);

  const userQuerySnapshot = await db.collection('capweather').where('email', '==', email).get();

  if (userQuerySnapshot.empty) {
    return res.render('login.ejs', {
      error: "User not found. Please check your email and password."
    });
  }

  const userData = userQuerySnapshot.docs[0].data();
  const hashedPasswordFromDB = userData.password;
  id=userQuerySnapshot.docs[0].id;
      console.log(id);
  try {
    const passwordsMatch = await bcrypt.compare(password, hashedPasswordFromDB);

    if (passwordsMatch) {
      
      console.log("Login success");
      return res.render("weather.ejs", {
        temp: "__",
        location: "__",
        winddir: "__",
        humidity: "__",
        wind: "__",
        climate: "__",
        date1: "__",
        date2: "__",
        tommtemp: "__",
        dayaftertemp: "__",
        tommcli: "__",
        dayaftercli: "__",
        icon1: "",
        error: "",
        pic: "https://img.icons8.com/ios-glyphs/30/sun--v1.png",
        pic2: "https://img.icons8.com/ios-glyphs/30/sun--v1.png",
        pic3: "https://img.icons8.com/ios-glyphs/30/sun--v1.png"
      }); 
    } else {
      
      console.log("Login Invalid");
      return res.render('login.ejs', {
        error: "Incorrect password. Please try again."
      });
    }
  } catch (error) {
    console.error("Error comparing passwords:", error);
    return res.render('login.ejs', {
      error: "An error occurred during login."
    });
  }
});




app.post('/weather', (req, res) => {
  const city = req.body.city;
  console.log(city);
  const weatherApi = `https://api.weatherapi.com/v1/forecast.json?key=efde69a9ee8f46198eb180312232508&q=${city}&days=3`;
  
  
  console.log(id);
  const cityname={
    city:city
  };
  db.collection('capweather').doc(id).update(cityname)
  .then(()=>{
    console.log("Doc insert succ");
  })
  .catch((error)=>{
    console.log("error in inserting")
  })
    axios.get(weatherApi).then((response) => {

    const temperature = response.data.current.temp_c;
    const humidity = response.data.current.humidity;
    const wind = response.data.current.wind_kph;
    const winddirection = response.data.current.wind_dir;
    const climate = response.data.current.condition.text;
    const tomm = response.data.forecast.forecastday[1];
    const date1 = tomm.date;
    const dayafter = response.data.forecast.forecastday[2];
    const date2 = dayafter.date;
    const tommtemp = tomm.hour[9].temp_c;
    const dayaftertemp = dayafter.hour[9].temp_c;
    const tommcli = tomm.day.condition.text;
    const dayaftercli = dayafter.day.condition.text
    const icon1 = response.data.forecast.forecastday[0].day.condition.icon;
    const icon2 = tomm.day.condition.icon;
    const icon3 = dayafter.day.condition.icon;


    res.render("weather.ejs", {
      temp: temperature,
      location: city,
      winddir: winddirection,
      humidity: humidity,
      wind: wind,
      climate: climate,
      date1: date1,
      date2: date2,
      tommtemp: tommtemp,
      dayaftertemp: dayaftertemp,
      tommcli: tommcli,
      dayaftercli: dayaftercli,
      error: "",
      pic: icon1,
      pic2: icon2,
      pic3: icon3
    });


    console.log("Search successfull")

  })
    .catch((error) => {
      console.log("City not found");
      res.render("weather.ejs", {
        temp: "__",
        location: "__",
        winddir: "__",
        humidity: "__",
        wind: "__",
        climate: "__",
        date1: "__",
        date2: "__",
        tommtemp: "__",
        dayaftertemp: "__",
        tommcli: "__",
        dayaftercli: "__",
        icon1: "",
        error: "Invalid Location",
        pic: "https://img.icons8.com/ios-glyphs/30/sun--v1.png",
        pic2: "https://img.icons8.com/ios-glyphs/30/sun--v1.png",
        pic3: "https://img.icons8.com/ios-glyphs/30/sun--v1.png"
      });
    });
})

app.get('/adminlogin',(req,res)=>{
  res.render("adminlog.ejs",{
    error:""
  })
})

app.post('/adminloginsubmit',(req,res)=>{
  const email = req.body.email;
  const pass = req.body.password;
  console.log(email,pass);
  if((email=='21pa1a12b8@vishnu.edu.in') && (pass=='ajaykumar')) {
    db.collection('capweather').get().then((docs)=>{
      if(docs.size>0){
        console.log("admin login success!");
        var userdata=[];
        db.collection('capweather').get().then((docs)=>{
          docs.forEach((doc)=>{
            const res=doc.data();
           
            console.log(res)
            userdata.push(res)
            
          });
        })
        .then(()=>{
          console.log(userdata);
          console.log(userdata.length)
          res.render('admindetails.ejs',{
            userData:userdata
          });
        })
      }
    })
    
  }
  else{
    res.render('adminlog.ejs',{
      error:"Ivalid Credentials"
    })
  }
})

app.listen(3000, () => {
  console.log("Server started");
})


