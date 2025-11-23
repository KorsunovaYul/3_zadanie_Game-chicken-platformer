"use client"

import { useRef, useEffect, useState } from "react"

type GameState = "start" | "playing" | "dialog" | "win" | "gameOver"

export default function ChickenPlatformer() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [gameState, setGameState] = useState<GameState>("start")

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Game constants
    const GAME_WIDTH = 1200
    const GAME_HEIGHT = 600
    const GRAVITY = 0.5
    const JUMP_FORCE = -12
    const MOVE_SPEED = 4

    canvas.width = GAME_WIDTH
    canvas.height = GAME_HEIGHT

    // Load images
    const skyImage = new Image()
    skyImage.crossOrigin = "anonymous"
    skyImage.src = "/images/free-1-bit-sky-and-clouds-pixel-backgrounds2.png"

    const chickenSprite = new Image()
    chickenSprite.crossOrigin = "anonymous"
    chickenSprite.src = "/images/free-20chicken-20sprites2.png"

    const eggNestSprite = new Image()
    eggNestSprite.crossOrigin = "anonymous"
    eggNestSprite.src = "/images/egg-and-nest2.png"

    const fenceSprite = new Image()
    fenceSprite.crossOrigin = "anonymous"
    fenceSprite.src = "/images/65e591b258d81fb.png"

    let currentGameState: GameState = "start"
    const camera = { x: 0, y: 0 }
    let lives = 3
    let eggsCollected = 0
    const totalEggs = 3
    let dialogText = ""
    let canProceed = false
    let showInitialDialog = true

    const platforms = [
      // Start area
      { x: 0, y: 520, width: 400, height: 80 },
      { x: 500, y: 480, width: 200, height: 40 },
      { x: 800, y: 440, width: 180, height: 40 },
      { x: 1080, y: 400, width: 200, height: 40 },
      { x: 1380, y: 360, width: 150, height: 40 },
      { x: 1600, y: 420, width: 200, height: 40 },
      { x: 1900, y: 380, width: 180, height: 40 },

      // Branching path - goes up and down
      { x: 2150, y: 440, width: 200, height: 40 },

      // Upper path (with egg)
      { x: 2450, y: 320, width: 180, height: 40 },
      { x: 2700, y: 260, width: 200, height: 40 },
      { x: 3000, y: 300, width: 180, height: 40 },
      { x: 3280, y: 340, width: 200, height: 40 },

      // Lower path (no egg)
      { x: 2450, y: 500, width: 180, height: 40 },
      { x: 2700, y: 520, width: 200, height: 40 },
      { x: 3000, y: 500, width: 180, height: 40 },
      { x: 3280, y: 480, width: 200, height: 40 },

      // Paths merge
      { x: 3580, y: 440, width: 180, height: 40 },
      { x: 3850, y: 400, width: 200, height: 40 },
      { x: 4150, y: 360, width: 180, height: 40 },
      { x: 4400, y: 420, width: 200, height: 40 },
      { x: 4700, y: 480, width: 180, height: 40 },
      { x: 5000, y: 440, width: 200, height: 40 },
      { x: 5300, y: 400, width: 180, height: 40 },
      // End area with fence
      { x: 5600, y: 520, width: 600, height: 80 },
    ]

    const eggs = [
      { x: 1150, y: 360, collected: false }, // On platform at y:400
      { x: 2750, y: 220, collected: false }, // On upper path platform at y:260
      { x: 4200, y: 320, collected: false }, // On platform at y:360 (4150, y:360)
    ]

    const fences = [
      { x: 5900, y: 440 },
      { x: 6020, y: 440 },
      { x: 6140, y: 440 },
    ]

    const otherChickens = [
      { x: 6000, y: 480, direction: 1, velocityX: 1, animationFrame: 0, animationTimer: 0 },
      { x: 6100, y: 480, direction: -1, velocityX: -0.8, animationFrame: 0, animationTimer: 0 },
      { x: 6050, y: 480, direction: 1, velocityX: 1.2, animationFrame: 0, animationTimer: 0 },
    ]

    // Player object
    const player = {
      x: 100,
      y: 400,
      width: 60,
      height: 60,
      velocityX: 0,
      velocityY: 0,
      isGrounded: false,
      direction: 1,
      animationFrame: 0,
      animationTimer: 0,
      isMoving: false,
      idleFrame: 0,
      idleTimer: 0,
    }

    // Keyboard state
    const keys: { [key: string]: boolean } = {}

    function restartGame() {
      lives = 3
      eggsCollected = 0
      eggs.forEach((egg) => (egg.collected = false))
      player.x = 100
      player.y = 400
      player.velocityX = 0
      player.velocityY = 0
      camera.x = 0
      currentGameState = "start"
      setGameState("start")
      showInitialDialog = true
    }

    // Event listeners
    const handleKeyDown = (e: KeyboardEvent) => {
      keys[e.key.toLowerCase()] = true

      if (currentGameState === "start" && e.key === " ") {
        if (showInitialDialog) {
          currentGameState = "dialog"
          setGameState("dialog")
          dialogText = "Мои дети! Я должна\nспасти своих детей!"
          canProceed = true
          showInitialDialog = false
        } else {
          currentGameState = "playing"
          setGameState("playing")
        }
        return
      }

      if (currentGameState === "dialog" && e.key === " ") {
        if (canProceed) {
          if (dialogText.includes("дома")) {
            currentGameState = "win"
            setGameState("win")
          } else {
            currentGameState = "playing"
            setGameState("playing")
          }
        } else {
          currentGameState = "playing"
          setGameState("playing")
        }
        return
      }

      if ((currentGameState === "gameOver" || currentGameState === "win") && e.key === "r") {
        restartGame()
        return
      }

      if (currentGameState === "playing") {
        if (e.key === " " && player.isGrounded) {
          player.velocityY = JUMP_FORCE
          player.isGrounded = false
        }
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      keys[e.key.toLowerCase()] = false
    }

    window.addEventListener("keydown", handleKeyDown)
    window.addEventListener("keyup", handleKeyUp)

    function drawPlatform(platform: { x: number; y: number; width: number; height: number }) {
      ctx.fillStyle = "#2d5016"
      ctx.fillRect(platform.x - camera.x, platform.y, platform.width, platform.height)

      // Dark edge
      ctx.fillStyle = "#1a3d0a"
      ctx.fillRect(platform.x - camera.x, platform.y, platform.width, 4)
    }

    // Draw player
    function drawPlayer() {
      ctx.save()

      const screenX = player.x - camera.x

      if (player.direction === -1) {
        ctx.scale(-1, 1)
        ctx.translate(-screenX - player.width, 0)
      }

      if (player.isMoving && player.isGrounded) {
        const frameX = player.animationFrame * 160
        const frameY = 160

        ctx.drawImage(
          chickenSprite,
          frameX,
          frameY,
          160,
          160,
          player.direction === 1 ? screenX : 0,
          player.y,
          player.width,
          player.height,
        )
      } else {
        const idleFrameX = player.idleFrame * 160
        const idleFrameY = 0

        ctx.drawImage(
          chickenSprite,
          idleFrameX,
          idleFrameY,
          160,
          160,
          player.direction === 1 ? screenX : 0,
          player.y,
          player.width,
          player.height,
        )
      }

      ctx.restore()
    }

    function drawOtherChickens() {
      otherChickens.forEach((chicken) => {
        ctx.save()

        const screenX = chicken.x - camera.x

        if (chicken.direction === -1) {
          ctx.scale(-1, 1)
          ctx.translate(-screenX - 50, 0)
        }

        const frameX = chicken.animationFrame * 160
        const frameY = 160

        ctx.drawImage(chickenSprite, frameX, frameY, 160, 160, chicken.direction === 1 ? screenX : 0, chicken.y, 50, 50)

        ctx.restore()
      })
    }

    function drawEggs() {
      eggs.forEach((egg) => {
        const screenX = egg.x - camera.x
        // Egg in nest (3rd sprite) or empty nest (4th sprite)
        const spriteX = egg.collected ? 480 : 320
        ctx.drawImage(eggNestSprite, spriteX, 0, 160, 160, screenX, egg.y, 50, 50)
      })
    }

    function drawFences() {
      fences.forEach((fence) => {
        const screenX = fence.x - camera.x
        ctx.drawImage(fenceSprite, 0, 0, fenceSprite.width, fenceSprite.height, screenX, fence.y, 120, 80)
      })
    }

    function drawHUD() {
      // Lives (hearts)
      ctx.fillStyle = "#ff0000"
      ctx.font = "24px monospace"
      for (let i = 0; i < lives; i++) {
        ctx.fillText("❤", 20 + i * 35, 35)
      }

      // Eggs counter (top right)
      ctx.fillStyle = "#fff"
      ctx.strokeStyle = "#000"
      ctx.lineWidth = 3
      ctx.font = "bold 28px monospace"
      const text = `Яйца: ${eggsCollected}/${totalEggs}`
      const textWidth = ctx.measureText(text).width
      ctx.strokeText(text, GAME_WIDTH - textWidth - 20, 35)
      ctx.fillText(text, GAME_WIDTH - textWidth - 20, 35)
    }

    function updateCamera() {
      const targetX = player.x - GAME_WIDTH / 2 + player.width / 2
      camera.x = Math.max(0, Math.min(targetX, 6200 - GAME_WIDTH))
    }

    function checkEggCollection() {
      eggs.forEach((egg) => {
        if (!egg.collected) {
          const distance = Math.sqrt(
            Math.pow(player.x + player.width / 2 - (egg.x + 25), 2) +
              Math.pow(player.y + player.height / 2 - (egg.y + 25 + 20), 2),
          )
          if (distance < 40) {
            egg.collected = true
            eggsCollected++
          }
        }
      })
    }

    function checkFenceCollision() {
      const firstFence = fences[0]
      if (player.x + player.width > firstFence.x && player.x < firstFence.x + 100) {
        currentGameState = "dialog"
        setGameState("dialog")

        if (eggsCollected === totalEggs) {
          dialogText = "Наконец-то ты дома,\nи детей своих спасла!"
          canProceed = true
        } else {
          dialogText = "Тебя не впустят домой!\nИди обратно ищи яйца!"
          canProceed = false
          // Push player back
          player.x = firstFence.x - 100
        }
      }
    }

    function updateOtherChickens() {
      otherChickens.forEach((chicken) => {
        chicken.x += chicken.velocityX

        // Bounce between fence area
        if (chicken.x < 5950 || chicken.x > 6150) {
          chicken.velocityX *= -1
          chicken.direction *= -1
        }

        chicken.animationTimer++
        if (chicken.animationTimer > 8) {
          chicken.animationTimer = 0
          chicken.animationFrame = (chicken.animationFrame + 1) % 4
        }
      })
    }

    // Update game state
    function update() {
      if (currentGameState !== "playing") {
        updateOtherChickens()
        return
      }

      // Horizontal movement
      player.isMoving = false

      if (keys["a"] || keys["arrowleft"]) {
        player.velocityX = -MOVE_SPEED
        player.direction = -1
        player.isMoving = true
      } else if (keys["d"] || keys["arrowright"]) {
        player.velocityX = MOVE_SPEED
        player.direction = 1
        player.isMoving = true
      } else {
        player.velocityX = 0
      }

      player.x += player.velocityX
      player.y += player.velocityY

      if (!player.isGrounded) {
        player.velocityY += GRAVITY
      }

      player.isGrounded = false
      platforms.forEach((platform) => {
        const collisionHeight = player.height - 18
        if (
          player.x + player.width > platform.x &&
          player.x < platform.x + platform.width &&
          player.y + collisionHeight >= platform.y &&
          player.y + collisionHeight <= platform.y + 20 &&
          player.velocityY >= 0
        ) {
          player.y = platform.y - collisionHeight
          player.velocityY = 0
          player.isGrounded = true
        }
      })

      if (player.y > GAME_HEIGHT) {
        lives--
        if (lives <= 0) {
          currentGameState = "gameOver"
          setGameState("gameOver")
        } else {
          // Respawn
          player.x = 100
          player.y = 400
          player.velocityX = 0
          player.velocityY = 0
          camera.x = 0
        }
      }

      // Animation timing
      if (player.isMoving && player.isGrounded) {
        player.animationTimer++
        if (player.animationTimer > 8) {
          player.animationTimer = 0
          player.animationFrame = (player.animationFrame + 1) % 4
        }
      } else {
        player.idleTimer++
        if (player.idleTimer > 30) {
          player.idleTimer = 0
          player.idleFrame = player.idleFrame === 0 ? 1 : 0
        }
      }

      updateCamera()
      checkEggCollection()
      checkFenceCollision()
      updateOtherChickens()
    }

    function render() {
      ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT)

      if (currentGameState === "start") {
        ctx.fillStyle = "#555"
        ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT)

        ctx.fillStyle = "#fff"
        ctx.font = "bold 48px monospace"
        ctx.textAlign = "center"
        ctx.fillText("Курица спешит домой", GAME_WIDTH / 2, 120)

        ctx.font = "18px monospace"
        ctx.fillStyle = "#aaa"
        ctx.fillText("Сделала: Юлия Коршунова", GAME_WIDTH / 2, 160)

        ctx.font = "24px monospace"
        ctx.fillStyle = "#fff"
        ctx.fillText("Правила:", GAME_WIDTH / 2, 220)
        ctx.font = "20px monospace"
        ctx.fillText("• Собери все 3 яйца из гнёзд", GAME_WIDTH / 2, 260)
        ctx.fillText("• Не упади с платформ!", GAME_WIDTH / 2, 290)
        ctx.fillText("• У тебя 3 жизни", GAME_WIDTH / 2, 320)
        ctx.fillText("• Доберись до дома с детьми", GAME_WIDTH / 2, 350)

        ctx.font = "28px monospace"
        ctx.fillText("Управление:", GAME_WIDTH / 2, 410)
        ctx.font = "22px monospace"
        ctx.fillText("A/D или ← → - движение", GAME_WIDTH / 2, 450)
        ctx.fillText("Пробел - прыжок", GAME_WIDTH / 2, 480)

        ctx.font = "bold 32px monospace"
        ctx.fillStyle = "#ffff00"
        ctx.fillText("Нажми ПРОБЕЛ для начала", GAME_WIDTH / 2, 540)

        ctx.font = "14px monospace"
        ctx.fillStyle = "#888"
        ctx.fillText(
          "Спрайты неба: CraftPix.net | Спрайты курицы и яиц: Sprout Lands - Asset Pack",
          GAME_WIDTH / 2,
          580,
        )

        return
      }

      if (currentGameState === "gameOver") {
        ctx.fillStyle = "#000"
        ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT)
        ctx.fillStyle = "#f00"
        ctx.font = "bold 64px monospace"
        ctx.textAlign = "center"
        ctx.fillText("GAME OVER", GAME_WIDTH / 2, GAME_HEIGHT / 2)
        ctx.fillStyle = "#fff"
        ctx.font = "28px monospace"
        ctx.fillText("Нажми R для рестарта", GAME_WIDTH / 2, GAME_HEIGHT / 2 + 60)
        return
      }

      if (currentGameState === "win") {
        ctx.fillStyle = "#000"
        ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT)
        ctx.fillStyle = "#0f0"
        ctx.font = "bold 64px monospace"
        ctx.textAlign = "center"
        ctx.fillText("ПОБЕДА!", GAME_WIDTH / 2, GAME_HEIGHT / 2)
        ctx.fillStyle = "#fff"
        ctx.font = "28px monospace"
        ctx.fillText("Ты спасла своих детей!", GAME_WIDTH / 2, GAME_HEIGHT / 2 + 60)
        ctx.font = "24px monospace"
        ctx.fillText("Нажми R для рестарта", GAME_WIDTH / 2, GAME_HEIGHT / 2 + 100)
        return
      }

      if (skyImage.complete) {
        const parallaxX = camera.x * 0.3
        const skyWidth = skyImage.width
        const skyHeight = skyImage.height
        const scale = GAME_HEIGHT / skyHeight
        const scaledWidth = skyWidth * scale

        ctx.save()
        const offset = parallaxX % scaledWidth
        for (let x = -scaledWidth - offset; x < GAME_WIDTH + scaledWidth; x += scaledWidth) {
          ctx.drawImage(skyImage, x, 0, scaledWidth, GAME_HEIGHT)
        }
        ctx.restore()
      } else {
        ctx.fillStyle = "#87CEEB"
        ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT)
      }

      // Draw platforms
      platforms.forEach(drawPlatform)

      // Draw eggs
      if (eggNestSprite.complete) {
        drawEggs()
      }

      if (chickenSprite.complete && fenceSprite.complete) {
        drawOtherChickens()
      }

      if (fenceSprite.complete) {
        drawFences()
      }

      // Draw player
      if (chickenSprite.complete) {
        drawPlayer()
      }

      drawHUD()

      if (currentGameState === "dialog") {
        ctx.fillStyle = "rgba(0, 0, 0, 0.7)"
        ctx.fillRect(GAME_WIDTH / 2 - 300, GAME_HEIGHT - 200, 600, 150)

        ctx.fillStyle = "#fff"
        ctx.font = "24px monospace"
        ctx.textAlign = "center"
        const lines = dialogText.split("\n")
        lines.forEach((line, i) => {
          ctx.fillText(line, GAME_WIDTH / 2, GAME_HEIGHT - 150 + i * 35)
        })

        ctx.font = "18px monospace"
        ctx.fillStyle = "#ffff00"
        ctx.fillText("Нажми ПРОБЕЛ", GAME_WIDTH / 2, GAME_HEIGHT - 70)
      }

      ctx.textAlign = "left"
    }

    // Game loop
    function gameLoop() {
      update()
      render()
      requestAnimationFrame(gameLoop)
    }

    // Start game
    gameLoop()

    // Cleanup
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      window.removeEventListener("keyup", handleKeyUp)
    }
  }, [])

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900">
      <canvas ref={canvasRef} className="border-4 border-gray-700 rounded" style={{ imageRendering: "pixelated" }} />
    </div>
  )
}
