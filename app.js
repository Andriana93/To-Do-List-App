//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"));

mongoose.connect("mongodb+srv://admin-andri:andriana@cluster0-l9yuh.mongodb.net/todolistDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false
});

const itemsSchema = {
  name: String
};


//in mongoose.model(); pass in two parameters:  <singularCollectionName> , <schemaName>
//when creating mongoose model always use capitalised e.g."Item".
const Item = mongoose.model('Item', itemsSchema);

const item1 = new Item({
  name: "Welcome to your To-Do list!"
});

const item2 = new Item({
  name: "Click the + button to add new items."
});

const item3 = new Item({
  name: "Click this to delete any items."
});

const defaultItems = [item1, item2, item3];

const listSchema = {
  name: String,
  items: [itemsSchema]

};

const List = mongoose.model("List", listSchema);


app.get("/", function(req, res) {

  Item.find({}, function(err, foundItems) {

    if (foundItems.length === 0) {

      Item.insertMany(defaultItems, function(err){
        if (err) {
          console.log(err);
        } else {
          console.log("Success! Array was inserted into model.");
        }
      });
      res.redirect("/");
    } else {
      res.render("list", {listTitle: "Today", newListItems: foundItems});
    }
  });

});


//create custom list
app.get("/:customListName", function(req, res) {
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({name: customListName}, function(err, foundList) {
    if (!err) {
      if (!foundList) {
        //create a new list
        const list = new List({
          name: customListName,
          items: defaultItems
        });

        list.save();

        res.redirect("/" + customListName);

      } else {
        //show an existing list
        res.render("list", {
          listTitle: foundList.name,
          newListItems: foundList.items
        });

      }
    }
  });

});





//adding new item to TOADY list and re-directing to that list
app.post("/", function(req, res) {

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({name: itemName});

  if(listName === "Today"){
    item.save();
    res.redirect("/");
  } else {
    //adding new item to customList and re-directing to that specific list
List.findOne({name: listName}, function(err, foundList){
  foundList.items.push(item);
  foundList.save();
  res.redirect("/" + listName);
});
  }
});




app.post("/delete", function(req, res) {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

    if(listName === "Today"){
      Item.findByIdAndRemove(checkedItemId, function(err) {
        if (!err) {
          console.log("Succesfully deleted item!" + checkedItemId);
          res.redirect("/");
        }
      });
    } else {

      List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}, function(err, foundList){
        if(!err){
          res.redirect("/" + listName);
        }
      });
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
  console.log("Server has started successfully");
});
