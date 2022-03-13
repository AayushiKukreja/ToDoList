const express = require("express") ;
const bodyparser= require("body-parser");
const mongoose= require("mongoose");
const app = express() ;
const _= require("lodash") ;
app.use(express.urlencoded({extended:true}));
app.use(express.json()) ;

app.use(express.static("public")) ;

mongoose.connect("mongodb://localhost:27017/todolistDB");

const itemSchema = new mongoose.Schema(
  {
    name: String
  }
);

const Item = mongoose.model("Item",itemSchema) ;

const item1 = new Item(
  {
    name :"Welcome to your to do list!"
  }
);

const item2 = new Item ({
  name : "Hit the + to add new items"
});

const item3 = new Item({
  name:"<-- Hit this to delete an item"
});

const defaultItems =[item1, item2,item3];
const ListSchema = new mongoose.Schema(
  {
    name:String ,
    items : [itemSchema]
  }
);
const List = mongoose.model("List",ListSchema);

app.set("view engine" , "ejs");

app.get("/",function(req,res)
{
  var today = new Date() ;
  var options = {
    weekday : "long" ,
    day : "numeric" ,
    month: "long"
  } ;

  var day1 = today.toLocaleDateString("en-US",options) ;
 Item.find({},function(err,FoundItems)
 {
  if(FoundItems.length==0)
  {
    Item.insertMany(defaultItems,function(err)
    {
     if(err)
     {
       console.log(err);
     }
     else
     {
       console.log("Successfully added items to DB");
     }
   });
   res.redirect("/");
  }
  else
  {
    res.render("list", {listTitle : "Today" , NewListItems : FoundItems} ) ;
  }
});
});

app.get("/:customListName",function(req,res)
{
  const customListName= _.capitalize(req.params.customListName);
  List.findOne({name:customListName},function(err,foundList)
{
  if(!err)
  {
    if(!foundList)
    {
      const list = new List(
        {
          name : customListName ,
          items : defaultItems
        });
      list.save();
      res.redirect("/"+customListName);
    }
    else
    {
      res.render("list", {listTitle : foundList.name , NewListItems : foundList.items} ) ;
    }
  }
})
});
app.post("/",function(request,response)
{
 const itemName = request.body.newItem ;
 const listName = request.body.list ;
 const item = new Item(
   {
     name : itemName
   }
 )
 if(listName=="Today")
 {
   item.save();
   response.redirect("/");
 }
 else
 {
   List.findOne({name : listName},function(err,foundList)
 {
   foundList.items.push(item);
   foundList.save();
   response.redirect("/"+ listName);
 });
 }
});

app.post("/delete",function(req,res)
{
const CheckedItemID=  req.body.checkbox ;
const listName = req.body.listName ;
if(listName=="Today")
{
Item.findByIdAndRemove(CheckedItemID,function(err)
{
  if(!err)
  {
    console.log("Successfully deleted the checked item");
    res.redirect("/");
  }
});
}
else
{
  List.findOneAndUpdate({name : listName},{$pull:{items:{_id:CheckedItemID}}},function(err)
{
  if(!err)
  {
    res.redirect("/"+listName);
  }
})
}
})

app.listen(3000,function(request,response)
{
  console.log("Server is up and running") ;
})
