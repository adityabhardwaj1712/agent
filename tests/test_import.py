import traceback
try:
    import seed_tools
except Exception as e:
    with open("error.txt", "w") as f:
        traceback.print_exc(file=f)
