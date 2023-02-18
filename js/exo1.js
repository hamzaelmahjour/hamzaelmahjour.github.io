function checkAnswer() {
    var userAnswer = document.getElementById("answer").value;
    if (userAnswer === answer) {
      document.getElementById("result").innerHTML = "Correct! Well done.";
    } else {
      document.getElementById("result").innerHTML = "Incorrect. Try again.";
    }
  }

// Display the problem
document.getElementById("problem").innerHTML = problem;