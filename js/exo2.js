const checkButton = document.querySelector("#check-button");
const userInput = document.querySelector("#user-input");
const result = document.querySelector("#result");

checkButton.addEventListener("click", function() {
  if (userInput.value === "2x + 5") {
    result.textContent = "Correct!";
  } else {
    result.textContent = "Incorrect, try again.";
  }
});