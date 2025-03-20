message = None

async def task_forever():
  global message
  while True:
    await asleep_ms(50)
    print(('This is message ' + str(message)))
    await asleep_ms(1000)
    message = (message if isinstance(message, (int, float)) else 0) + 1

async def setup():
  global message
  print('App started')
  print('Hello from YoloUno')
  await asleep_ms(1000)
  message = 0

  create_task(task_forever())

async def main():
  await setup()
  while True:
    await asleep_ms(100)

run_loop(main())
