
console.log("utils.js loaded");

ValueHolder.makerValueHolder = new Array();
function ValueHolder() {
    // do something

    // call to static variable
    alert("foo.staticVar: " + ValueHolder.makerValueHolder.length);
}
