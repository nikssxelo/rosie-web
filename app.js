const chat = document.getElementById("chat");

function addMessage(text,type){
const div = document.createElement("div");
div.className = type;
div.innerText = text;
chat.appendChild(div);
chat.scrollTop = chat.scrollHeight;
}

async function sendMessage(){

const input = document.getElementById("message");

const message = input.value.trim();

if(!message) return;

addMessage(message,"user");

input.value="";

addMessage("Rosie is thinking...","bot");

}
