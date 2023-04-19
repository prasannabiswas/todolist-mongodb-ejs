const express = require("express");
require('dotenv').config(); 
const bodyParser = require("body-parser");
const mongoose = require("mongoose"); 
const _ = require("lodash");

// const date = require(__dirname + "/date.js");

const app = express();
app.set('view engine', 'ejs');

// For local host connect
const localhost = "mongodb://0.0.0.0/27017:/todolistdb";

// Main mongoose->mongodb cluster connect Template
mongoose.connect(process.env.MONGO_URI,{
  useNewUrlParser: true, 
  useUnifiedTopology:true
})
.then(()=>console.log("Connected to DB.")) 
.catch((err)=>console.log(err));

// Alternative Code for mongoose->mongodb cluster connect to Cluster
// mongoose.set('strictQuery', false);
// const connectDB = async ()=>{
//   try{
//     const conn = await mongoose.connect(process.env.MONGO_URI);
//     console.log(`MongoDB Connected: ${conn.connection.host}`);
//   }
//   catch (err){
//     console.log(err);
//   }
// }
// connectDB();

const itemsSchema = new mongoose.Schema ({
  name : String
});

const Item = mongoose.model("Item",itemsSchema);

const item1 = new Item({name: "Welcome to your todolist"});
const item2 = new Item({name: "Hit the + button to add a new item."});
const item3 = new Item({name: "<-- Hit this to delete an item."});

const defaultItems = [item1,item2,item3];

const listSchema = new mongoose.Schema({
  name: String,
  items: [itemsSchema]
});

const List = mongoose.model("list",listSchema);

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

// const items = ["Buy Food", "Cook Food", "Eat Food"];
// const workItems = [];

app.get("/", function(req, res) {

  Item.find()
  .then((items)=>{
    if(items.length===0){
      Item.insertMany(defaultItems)
      .then(()=>console.log("Successfully added to DB."))
      .catch((err)=>console.log(err));
      res.redirect("/");
    }
    else {
      res.render("list", {listTitle: "Today", newListItems: items});
    }
  })
  .catch((err)=>console.log(err));
});


app.post("/", function(req, res){
  const itemName = req.body.newItem;
  const listName = req.body.list;
  
  const item = new Item({
    name: itemName
  });

  if(listName === "Today"){    
    item.save();
    res.redirect("/");
  }
  else{
    List.findOne({name: listName})
    .then((foundList)=>{
      foundList.items.push(item);
      foundList.save();
      res.redirect("/"+listName);
    })
    .catch((err)=>console.log(err));
  }

});

app.post("/delete",(req,res)=>{
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if(listName === "Today"){
    Item.findByIdAndRemove(checkedItemId)
    .then(()=>console.log("Item deleted with id "+checkedItemId))
    .catch((err)=>console.log(err));

    res.redirect("/");
  }
  else{
    List.findOneAndUpdate({name:listName}, {$pull:{items:{_id:checkedItemId}}})
    .then(()=>{console.log(`Item deleted with id ${checkedItemId}`)})
    .catch((err)=>console.log(err));

    res.redirect("/"+listName);
  }

  
});

app.get("/:customListName",(req,res)=>{
  const customListName =  _.capitalize(req.params.customListName);

  
  List.findOne({name: customListName})
  .then((foundList)=>{
    if(foundList){
      // console.log("Exist's!");
      res.render("list", {listTitle: customListName, newListItems: foundList.items})
    }
    else{
      // console.log("Doesn't Exist!");
      const list = new List ({
        name: customListName,
        items: defaultItems
      });
      list.save();
      res.redirect("/"+customListName);
      // res.redirect(`/${customListName}`); // Above code alternative
    }
  })
  .catch((err)=>{
    console.log(err);
  })
  
});

app.get("/about", function(req, res){
  res.render("about");
});

app.listen(process.env.PORT, function() {
  console.log("Server started on port 3000");
});
