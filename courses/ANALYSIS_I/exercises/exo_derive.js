let exercise = document.getElementById("exo_derive").innerText;

let blanks = exercise.match(/_____/g);

let solution = exercise.replace(/_____/g, '<input type="text" class="blank">');

document.getElementById("exo_derive").innerHTML = solution;

let inputs = document.querySelectorAll('.blank');

for (let i = 0; i < inputs.length; i++) {
  inputs[i].addEventListener('input', function() {
    let solution = '';
    let answers = document.querySelectorAll('.blank');

    for (let j = 0; j < answers.length; j++) {
      let answer = answers[j].value;
      if (answer) {
        solution += answer;
      } else {
        solution += '_____';
      }

      if (j < answers.length - 1) {
        solution += ' ';
      }
    }

    document.getElementById("solution").value = solution;
  });
}
