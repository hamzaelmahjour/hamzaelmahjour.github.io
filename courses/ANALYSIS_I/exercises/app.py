from flask import Flask, render_template, request
from exo_derive import fct, derivative, user_input

app = Flask(__name__)

@app.route('/')
def index():
    exercise = fct
    print(f"Find the derivative of the following function {fct}\n")
    return render_template('exo_derive.html', exercise=exercise)

@app.route('/', methods=['POST'])
def check():
    exercise = request.form['exo_derive']
    solution = derivative
    return render_template('exo_derive.html', exercise=user_input, solution=solution)

if __name__ == '__main__':
    app.run(debug=True)