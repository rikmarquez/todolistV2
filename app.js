//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");
const date = require(__dirname + "/date.js");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({
  extended: true
}));

app.use(express.static("public"));

// mongoose.connect("mongodb://localhost:27017/todolistDB", {
//   useNewUrlParser: true
// });

mongoose.connect("mongodb+srv://rikmarquez:test1234@cluster0.sdwuo.mongodb.net/todolistDB", {
  useNewUrlParser: true
});

// Creando la collection: items & alta de items por default
const ItemsSchema = new mongoose.Schema({
  name: String
});

const Item = new mongoose.model("Item", ItemsSchema);

const item1 = new Item({
  name: "Bienvenido a todolist v2"
});
const item2 = new Item({
  name: "Oprime + para agregar un nuevo item!"
});
const item3 = new Item({
  name: "<-- Oprime aqui para borrar"
});

const defaultItems = [item1, item2, item3];

//Crear Schema y model para Custom newListItems
const listSchema = new mongoose.Schema({
  name: String,
  items: [ItemsSchema]
});

const List = new mongoose.model("List", listSchema);

//Render localhost
app.get("/", function(req, res) {
  Item.find({}, function(err, items) {
    if (items.length === 0) {
      Item.insertMany(defaultItems, function(err) {
        if (err) {
          console.log(err);
        } else {
          console.log("Items por default, grabados exitosamente!");
        }
      });
      res.redirect("/");
    } else {
      res.render("list", {
        listTitle: "Today",
        newListItems: items
      });
    }
  });
});


app.get("/:customListName", function(req, res){
  const listName = _.capitalize(req.params.customListName);

  List.findOne({name: listName}, function(err, foundList){
    if (!err) {
      if (!foundList) {
        const list = new List ({
          name: listName,
          items: defaultItems
        });
        list.save();
        res.redirect("/"+listName);
      } else {
        res.render("list", {
          listTitle: foundList.name,
          newListItems: foundList.items
        });
      };
    };
  });
});


app.post("/", function(req, res) {

  const itemName = req.body.newItem;
  const listName = req.body.list;

  newItem = new Item({name: itemName});

  if (listName==="Today") {
    newItem.save();
    res.redirect("/")
  } else {
    List.findOne({name: listName}, function(err, listFound){
      if (!err) {
        listFound.items.push(newItem);
        listFound.save();
        res.redirect("/"+listName);
      };
    })
  };
});


app.post("/delete", function(req, res){
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName==="Today") {
    Item.findByIdAndRemove(checkedItemId, function(err){
      if (err) {
        console.log(err);
      } else {
        console.log("Item borrado exitosamente");
        res.redirect("/");
      }
    });
  } else {
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}, function(err, foundList){
      if (!err) {
        res.redirect("/"+listName);
      }
    })
  }
});

app.get("/about", function(req, res) {
  res.render("about");
});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

app.listen(port, function() {
  console.log("Server started successfuly");
});
