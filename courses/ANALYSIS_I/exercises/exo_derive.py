import random
import sympy

# Read the file containing the list of functions
with open('functions.txt', 'r') as f:
    functions = f.readlines()

# Select a random function from the list
fct = random.choice(functions).strip()

# Convert the function string to a SymPy expression
x = sympy.symbols('x')
expr = sympy.sympify(fct)

# Compute the derivative of the selected function
derivative = sympy.diff(expr, x)

# Ask the user to input the derivative of the selected function
user_input = input(f"Find the derivative of the function: {fct}\n")

# Convert the user input to a SymPy expression
user_expr = sympy.sympify(user_input)

# Compare the user's input with the computed derivative
if derivative == user_expr:
    print("Correct!")
else:
    print("Incorrect. \n")
    print("The right derivative was : \n")
    print(derivative)

