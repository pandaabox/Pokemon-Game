let count = 0
class Move {
    constructor(name, type, power, pp, effect = null) {
        this.name = name
        this.type = type
        this.power = power
        this.pp = pp
        this._pp = pp
        this.effect = effect
    }
    async use(user, target) {
        // checks evasiveness and resets it after certain amount of turns
        for (const pokemon of [user, target]) {             
            if (
                pokemon.evasionStart !== undefined &&
                count - pokemon.evasionStart >= 2
            ) {
                pokemon.evasiveness = 0
                pokemon.evasionStart = undefined
            }
        }
        // checks for status effects and removes it after certain amount of turns
        for (const pokemon of [user, target]) {
            if (
                pokemon.status?.startTurn !== undefined &&
                count - pokemon.status?.startTurn >= 5
            ) {
                const statusEff = document.querySelectorAll(`.${pokemon.name.toLowerCase()}-status-eff`)
                if (pokemon.status?.type === "PARALYSIS") {
                    statusEff.forEach(element => {
                        element.classList.remove("status-par")
                        element.textContent = ""
                    })
                }
                pokemon.status = null
            }
        }
        cmdMenu.innerHTML = changedHTML
        const mainLogic = async (power) => {
            const damage = Math.round(
                (power / 8) * (user.level / 10)
            )
            const newHP = (target.hp - damage) / (target.maxHP) * 100
            const targetHP = document.getElementById(`${target.name.toLowerCase()}-hp`)
            target.hp = Math.max(
                0,
                target.hp - damage
            )
            const colorChange = () => {
                targetHP.classList.remove(
                    "hp-green",
                    "hp-yellow",
                    "hp-red"
                )
                if (newHP <= 20) {
                    targetHP.classList.add("hp-red")
                }
                else if (newHP <= 50) {
                    targetHP.classList.add("hp-yellow")
                }
                else {
                    targetHP.classList.add("hp-green")
                }
            }
            if (target.hp > 0) {
                targetHP.style.width = `${newHP}%`
                colorChange()
            }
            else {
                targetHP.style.width = "0%"
                await sleep(2000)
                colorChange()
                if (pikachu.hp <= 0) {
                    const elements = document.querySelectorAll(".p_hidden")
                    elements.forEach((element) => {
                        element.classList.add("hidden")
                    })
                    await showMessage("PIKACHU fainted!")
                    await sleep(1000)
                    await showMessage("YOU are out of usable POKéMONS.")
                    await sleep(1000)
                    await showMessage("YOU whited out.")
                    await sleep(2000)
                }
                else if (arcanine.hp <= 0) {
                    const elements = document.querySelectorAll(".a_hidden")
                    elements.forEach((element) => {
                        element.classList.add("hidden")
                    })
                    await showMessage("ARCANINE fainted!")
                    await sleep(1000)
                    await showMessage("Player defeated Foe ARCANINE!")
                    await sleep(1500)
                }
                document.body.classList.add("fade-out");
                setTimeout(() => {
                    document.body.innerHTML = ""
                }, 500)
            }
        }
        const attack = async () => {
            await showMessage(`${user.name} used ${this.name}!`)
            await sleep(1000)
            await mainLogic(this.power)
        }
        if (user.status?.type == "PARALYSIS") {
            if (Math.random() < 0.4) {
                if (user == pikachu) {
                    await showMessage(`${user.name} is paralyzed! \nIt can't move!`)
                } else if (user == arcanine) {
                    await showMessage(`Foe ${user.name} is paralyzed! \nIt can't move!`)
                    await sleep(500)
                }
                console.log(this.name)
                this._pp--
                count += 0.5
                return
            }
        }
        if (Math.random() * 100 < target.evasiveness) {
            await showMessage(`${user.name} used ${this.name}!`)
            await sleep(1000)
            await showMessage(`${user.name}'s attack missed!`)
            await sleep(1000)
            this._pp--
            count += 0.5
            return
        }
        await attack()
        if (this.effect) {
            await this.effect(user, target)
        }
        this._pp--
        count += 0.5
    }
}

const quickAttack = new Move(
    "QUICK ATTACK",
    "NORMAL",
    40,
    30,
)

const thundershock = new Move(
    "THUNDERSHOCK",
    "ELECTRIC",
    40,
    30
)

const thunderWave = new Move(
    "THUNDER WAVE",
    "ELECTRIC",
    0,
    20,
    async (user, target) => {
        target.status = {
            type: "PARALYSIS",
            startTurn: count
        }
        const statusEff = document.querySelectorAll(`.${target.name.toLowerCase()}-status-eff`)
        await sleep(1000)
        statusEff.forEach((element) => {
            element.classList.add("status-par")
            element.textContent = "PAR"
        })
        await showMessage(`Foe ${target.name} got paralyzed! \nIt may be unable to move now!`)
        await sleep(500)
    }
)

const thunderbolt = new Move(
    "THUNDERBOLT",
    "ELECTRIC",
    90,
    15
)

const bite = new Move(
    "BITE",
    "DARK",
    60,
    25
)

const ember = new Move(
    "EMBER",
    "FIRE",
    40,
    25
)

const flamethrower = new Move(
    "FLAMETHROWER",
    "FIRE",
    90,
    15
)

const doubleTeam = new Move(
    "DOUBLE TEAM",
    "NORMAL",
    0,
    15,
    (user, target) => {
        user.evasiveness = Math.min(
            user.evasiveness + 40,
            80
        )
        user.evasionStart = count
    }
)

class Pokemon {
    constructor(name, level, baseHP, moves, evasiveness) {
        this.name = name
        this.level = level
        this.baseHP = baseHP
        this.maxHP = Math.round(((baseHP + level) / 4) * 5 + 10);
        this.hp = this.maxHP
        this.moves = moves
        this.evasiveness = evasiveness
        this.evasionStart = undefined
        this.status = null
    }
}

const pikachu = new Pokemon(
    "PIKACHU",
    28,
    35,
    [quickAttack, thundershock, thunderWave, thunderbolt],
    0
)

const arcanine = new Pokemon(
    "ARCANINE",
    30,
    55,
    [bite, ember, flamethrower, doubleTeam],
    0
)

let gameState = "mainMenu"
let options = document.querySelectorAll(".options")
let selected = 0
let busy = false

const updateOption = () => {
    options.forEach((option) => {
        option.classList.remove("selected")
    })
    options[selected].classList.add("selected")
}

let moves
let pp
let type
const updateMove = () => {
    moves.forEach((move) => {
        move.classList.remove("selected")
    })
    moves[selected].classList.add("selected")
    pp.textContent = `${pikachu.moves[selected]._pp}/${pikachu.moves[selected].pp}`
    type.textContent = `${pikachu.moves[selected].type}`
}

window.addEventListener("keydown", (e) => {
    if (e.key === "ArrowUp") {
        if (selected === 2) {
            selected = 0
        } else if (selected === 3) {
            selected = 1
        }
    }
    if (e.key === "ArrowDown") {
        if (selected === 0) {
            selected = 2
        } else if (selected === 1) {
            selected = 3
        }
    }
    if (e.key === "ArrowLeft") {
        if (selected === 1) {
            selected = 0
        } else if (selected === 3) {
            selected = 2
        }
    }
    if (e.key === "ArrowRight") {
        if (selected === 0) {
            selected = 1
        } else if (selected === 2) {
            selected = 3
        }
    }
    if (gameState === "mainMenu") { updateOption() }
    else if (gameState === "moveMenu") { updateMove() }
})

let cmdMenu = document.getElementById("cmd-menu")
let ogHTML = cmdMenu.innerHTML
let changedHTML = `
    <div id="changed-border">
        <div id="changed-box">
            <span id="changed-span">
            </span>
        </div>
    </div>
`
const typeText = (text, chSpan) => {
    return new Promise((resolve) => {
        let index = 0
        chSpan.textContent = ""
        const type = () => {
            if (index < text.length) {
                chSpan.textContent += text[index]
                index++
                setTimeout(type, 40)
            } else {
                resolve()
            }
        }
        type()
    })
}

const sleep = (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms))
}

const showMessage = async (text) => {
    cmdMenu.innerHTML = changedHTML
    const chSpan = document.getElementById("changed-span")
    if (text.includes("\n")) {
        chSpan.classList.add("changed-span-new-line")
    }
    await typeText(text, chSpan)
}

const showTempMessage = async (text) => {
    await showMessage(text)
    await sleep(1000)
    cmdMenu.innerHTML = ogHTML
    options = document.querySelectorAll(".options")
    selected = 0
}

let movesHTML = `
    <div id="moves-border">
        <div id="moves">
            <span class="moves selected">${pikachu.moves[0].name}</span>
            <span class="moves">${pikachu.moves[1].name}</span>
            <span class="moves">${pikachu.moves[2].name}</span>
            <span class="moves">${pikachu.moves[3].name}</span>
        </div>
    </div>
    <div id="stats-border">
        <div id="stats">
            <span class="stat" id="pp_">PP</span>
            <span class="stat" id="pp">${pikachu.moves[selected]._pp}/${pikachu.moves[selected].pp}</span>
            <span class="stat" id="type_">TYPE</span>
            <span class="stat" id="type">${pikachu.moves[selected].type}</span>
        </div>
    </div>
`

const fight = () => {
    cmdMenu.innerHTML = movesHTML
    selected = 0
    gameState = "moveMenu"
    moves = document.querySelectorAll(".moves")
    pp = document.getElementById("pp")
    type = document.getElementById("type")
    updateMove()
}

const arcanineTurn = async () => {
    const randomMove = Math.floor(Math.random() * arcanine.moves.length)
    await arcanine.moves[randomMove].use(arcanine, pikachu)
}

const bag = async () => {
    await showTempMessage("You have no items in your bag!");
}

const pokemonMenu = async () => {
    await showTempMessage("You have no POKéMONs left!");
}

const run = async () => {
    await showTempMessage("Can't Escape!");
}

window.addEventListener("keydown", async (e) => {
    if (e.key !== "Enter") return
    if (busy) return
    busy = true
    try {
        if (gameState === "mainMenu") {
            if (selected === 0) {
                fight()
            }
            if (selected === 1) {
                await bag()
            }
            if (selected === 2) {
                await pokemonMenu()
            }
            if (selected === 3) {
                await run()
            }
        } else if (gameState === "moveMenu") {
            await pikachu.moves[selected].use(pikachu, arcanine)
            if (arcanine.hp > 0) {
                await arcanineTurn()
            }
            if (pikachu.hp > 0 && arcanine.hp > 0) {
                cmdMenu.innerHTML = ogHTML
                options = document.querySelectorAll(".options")
                selected = 0
                gameState = "mainMenu"
            }
        }
    } finally {
        busy = false
    }
})

window.addEventListener("keydown", (e) => {
    if (e.key != "Backspace") return
    if (gameState === "moveMenu") {
        cmdMenu.innerHTML = ogHTML
        options = document.querySelectorAll(".options")
        selected = 0
        gameState = "mainMenu"
        console.log("done")
    }
})