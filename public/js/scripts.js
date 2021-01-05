const selects = document.getElementsByClassName("action-select");
document.getElementById("randomButton").addEventListener("click", event => {
  for (let select of selects) {
    let options = select.getElementsByTagName("option");
    let value = options[Math.floor(Math.random() * options.length)].value;
    select.value = value;
  }
});