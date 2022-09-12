// Import statements
///<reference lib="es2015.symbol" />
///<reference lib="es2015.symbol.wellknown" />
///<reference lib="es2015.collection" />
///<reference lib="es2015.iterable" />

import { Client } from "colyseus.js"
import * as utils from '@dcl/ecs-scene-utils'
import { movePlayerTo } from '@decentraland/RestrictedActions'
import { getUserData } from "@decentraland/Identity"
import { Room } from 'colyseus.js'
import { getCurrentRealm } from '@decentraland/EnvironmentAPI'
import { connect } from './connection'
import { FollowsPlayer } from './follow'


connect('my_room').then((room) => { 

    // Weapon collection
    let weapons: Array<Weapons> = []
    let weaponShow = new UICanvas()
    let weaponDisplay = new UIText(weaponShow)
    weaponDisplay.value = "Weapon: "
    weaponDisplay.hAlign = "left"
    weaponDisplay.fontSize = 15
    weaponDisplay.positionX = 50

    // Weapon durability
    let durabilityShow = new UICanvas()
    let durabilityDisplay = new UIText(durabilityShow)
    durabilityDisplay.value = "Durability: "
    durabilityDisplay.vAlign = "bottom"
    durabilityDisplay.fontSize = 15
    durabilityDisplay.positionX = 50

    // Player health
    let playerHealth = 200
    let playShow = new UICanvas()
    let playDisplay = new UIText(playShow)
    playDisplay.hAlign = "right"
    playDisplay.value = "Player Health: " + playerHealth
    playDisplay.fontSize = 15
    playDisplay.positionX = -50


    function checkZero() {
        if (playerHealth < 0) {
            playerHealth = 0
            playDisplay.value = "Player Health: " + playerHealth
        }
    }
    

    // Levels
    let kills = 0
    let level = 1
    let levelShow = new UICanvas()
    let levelDisplay = new UIText(levelShow)
    levelDisplay.value = "Level: " + level
    levelDisplay.vAlign = "top"
    levelDisplay.fontSize = 15

    // Player Kills
    let playerKills = 0
    let killShow = new UICanvas()
    let killDisplay = new UIText(killShow)
    killDisplay.value = "Kills: " + playerKills
    killDisplay.hAlign = "right"
    killDisplay.fontSize = 15
    killDisplay.positionX = -50
    killDisplay.positionY = -15

    // User option to restart game
    function reset() {
        weapons = []
        weaponDisplay.value = "Weapon: "
        durabilityDisplay.value = "Durability: "
        playerHealth = 200
        playDisplay.value = "Player Health: " + playerHealth
        kills = 0
        level = 1
        levelDisplay.value = "Level: " + level
        setLevel(level)
        updateWall(walls)
        movePlayerTo({ x: 1, y: 0, z: 14 }, { x: 8, y: 1, z: 8 })
    }

    
    
    
    // Function for monster
    function spawnMonster(x: number, y: number, z: number) {

        const monster = new Entity()
        monster.addComponent(new GLTFShape("models/Dog.gltf"))
        monster.addComponent(new Transform({
            position: new Vector3(x, y, z),
            scale: new Vector3(0.5, 0.5, 0.5)
        }))

        // Define monster health
        let monsterHealth = 50
        if (level == 3) {
            monsterHealth = 100
        }

        // Click to kill
        monster.addComponent(new OnPointerDown((e) => {
            if ((monsterHealth < 20 && level < 3) || (monsterHealth < 30 && level == 3)) {
                engine.removeEntity(monster)
                kills = kills + 1
                weaponDisplay.value = "Weapon: " + weapons[0].attacker
                // Change level and conditions if new level reached
                if (kills == setLevelKills(level)) {
                    level = level + 1
                    room.send("newLevel", level)
                    levelDisplay.value = "Level: " + level
                    movePlayerTo({ x: 1, y: 0, z: 14 }, { x: 8, y: 1, z: 8 })
                    setLevel(level)
                    updateWall(walls)
                }
            } else if (weapons.length > 0) {
                if (weapons[0].durability == 0) {
                    weapons.shift()
                    weaponDisplay.value = "Weapon: " + weapons[0].attacker
                    durabilityDisplay.value = "Durability: "
                } else {
                    monsterHealth = monsterHealth - weapons[0].damage
                    weapons[0].durability = weapons[0].durability - 1
                    weaponDisplay.value = "Monster Health: " + monsterHealth
                    durabilityDisplay.value = "Durability: " + weapons[0].durability
                }

            } else {
                weaponDisplay.value = "No Weapon Equipped!"
            }
        }))

        // Monster Attacks
        monster.addComponent(new utils.TriggerComponent(new utils.TriggerBoxShape(new Vector3(5, 5, 5), new Vector3(2, 2, 2)), {
            onCameraEnter: () => {
                // If player dies
                if (playerHealth < 10) {
                    setLevel(4)
                } else if (level == 3) {
                    playerHealth = playerHealth - 25
                    playDisplay.value = "Player Health: " + playerHealth
                } else {
                    playerHealth = playerHealth - 10
                    playDisplay.value = "Player Health: " + playerHealth
                }
                checkZero()
            }
        }))

        monster.addComponent(new FollowsPlayer())

        return monster

    }

    class Weapons {

        fighter: Entity
        attacker: string
        damage: number
        durability: number

        constructor(a: string, d: number, f: Entity, x: number) {
            this.attacker = a
            this.damage = d
            this.fighter = f
            this.durability = x
        }

        fight() {
            return this.fighter
        }

    }


    // Function for weapons
    function spawnWeapon(x: number, y: number, z: number, w: number) {
        // create the weapon
        const sword = new Entity()
        let item: Weapons = new Weapons("", 0, sword, 0)

        // add a transform to the entity
        sword.addComponent(new Transform())

        sword.getComponent(Transform).position.set(x, y, z)
        sword.getComponent(Transform).scale.set(0.5, 0.5, 0.5)

        if (w == 1) {
            sword.addComponent(new GLTFShape("models/Sword.gltf"))
        } else if (w == 2) {
            sword.addComponent(new GLTFShape("models/Arrow.gltf"))
        } else if (w == 3) {
            sword.addComponent(new GLTFShape("models/Blaster.gltf"))
        }

        // add trigger component
        sword.addComponent(new utils.TriggerComponent(new utils.TriggerBoxShape(sword.getComponent(Transform).position, new Vector3(1, 1.5, 1)), {
            onCameraEnter: () => {
                if (w == 1) {
                    item = new Weapons("Sword", 10, sword, 5)
                } else if (w == 2) {
                    item = new Weapons("Crossbow", 20, sword, 4)
                } else if (w == 3) {
                    item = new Weapons("Pistol", 30, sword, 3)
                }
                engine.removeEntity(sword)
                if (weapons.length > 2) {
                    weapons[2] = item
                } else {
                    weapons.push(item)
                }
                weaponDisplay.value = "Weapon: " + weapons[0].attacker
            }
        }))

        return sword
    }

    // How to switch weapons
    function switchWeapons(weaponList: Weapons[]) {

        if (weaponList.length < 3) {
            let placeholder = weaponList[0]
            weaponList[0] = weaponList[1]
            weaponList[1] = placeholder
        } else {
            let placeholder = weaponList[0]
            let placeholder2 = weaponList[1]
            weaponList[0] = placeholder2
            weaponList[1] = weaponList[2]
            weaponList[2] = placeholder
        }

    }

    class ButtonChecker implements ISystem {
        update() {
            if (Input.instance.isButtonPressed(ActionButton.SECONDARY).BUTTON_DOWN) {
                switchWeapons(weapons)
                weaponDisplay.value = "Weapon: " + weapons[0].attacker
                durabilityDisplay.value = "Durability: " + weapons[0].durability
            }
        }
    }

    engine.addSystem(new ButtonChecker())

    // Set levels
    function setLevelKills(level: number) {

        let levelKills = 0

        if (level == 1) {
            levelKills = 1
        } else if (level == 2) {
            levelKills = 3
        } else if (level == 3) {
            levelKills = 4
        }

        return levelKills
    }


    // Small Building
    let smallBuilding = new Entity()
    smallBuilding.addComponent(new GLTFShape("models/SmallBuilding.glb"))
    smallBuilding.addComponent(new Transform({
        position: new Vector3(12.5, 0, 12.5),
        scale: new Vector3(1, 0.75, 1)
    }))


    function setLevel(level1: number) {

        // Monsters and weapons
        const bees: Entity[] = [spawnMonster(11, 0, 13), spawnMonster(11, 0, 13), spawnMonster(11, 0, 3), spawnMonster(11, 0, 13)]
        const weapons: Entity[] = [spawnWeapon(8, 1, 8, 1), spawnWeapon(11, 1, 13, 1), spawnWeapon(8, 1, 8, 2), spawnWeapon(8, 1, 8, 1), spawnWeapon(11, 1, 3, 2), spawnWeapon(8, 1, 8, 3)]


        // Depending on level...add or remove 
        if (level1 == 1) {
            engine.addEntity(bees[0])
            engine.addEntity(weapons[0])
        } else if (level1 == 2) {
            movePlayerTo({ x: 1, y: 1, z: 14 }, { x: 8, y: 1, z: 8 })
            engine.removeEntity(bees[0])
            engine.removeEntity(weapons[0])
            engine.addEntity(bees[1])
            engine.addEntity(bees[2])
            engine.addEntity(weapons[1])
            engine.addEntity(weapons[2])
        } else if (level1 == 3) {
            engine.removeEntity(bees[1])
            engine.removeEntity(bees[2])
            engine.removeEntity(weapons[1])
            engine.removeEntity(weapons[2])
            engine.addEntity(smallBuilding)
            movePlayerTo({ x: 1, y: 1, z: 14 }, { x: 8, y: 1, z: 8 })
            engine.addEntity(bees[3])
            bees[3].getComponent(Transform).scale.set(1, 1, 1)
            engine.addEntity(weapons[3])
            engine.addEntity(weapons[4])
            engine.addEntity(weapons[5])
        } else if (level1 > 3) {
            engine.removeEntity(bees[3])
            engine.removeEntity(weapons[3])
            engine.removeEntity(weapons[4])
            engine.removeEntity(weapons[5])
            engine.removeEntity(smallBuilding)
            movePlayerTo({ x: 0, y: 1, z: 0 }, { x: 8, y: 1, z: 8 })
            if (playerHealth > 0) {
                levelDisplay.value = "Win"
                room.send("win", [user, playerHealth, playerKills, username])
            } else {
                levelDisplay.value = "Loss"
            }
            weaponDisplay.value = ""
            durabilityDisplay.value = ""
            playDisplay.value = ""
            killDisplay.value = ""
            updateWall(walls)
        }

    }

    let walls: Array<Entity> = []

    // Function for walls
    function buildWall(x: number, y: number, z: number) {
        const wall = new Entity()
        wall.addComponent(new BoxShape())
        wall.addComponent(new Transform({
            position: new Vector3(x, y, z),
            rotation: Quaternion.Euler(0, 0, 0),
            scale: new Vector3(1, 4, 1)
        }))

        walls.push(wall)

        engine.addEntity(wall)
    }

    let number = new Material()

    function updateWall(borders: Entity[]) {

        for (let i = 0; i < borders.length; i++) {
            borders[i].removeComponent(number)
        }

        if (level == 1) {
            number.albedoTexture = new Texture("images/One.jfif")
        } else if (level == 2) {
            number.albedoTexture = new Texture("images/Two.jfif")
        } else if (level == 3) {
            number.albedoTexture = new Texture("images/One.jfif")
        } else {
            number.albedoTexture = new Texture("images/ReggieMiller")
        }

        for (let i = 0; i < borders.length; i++) {
            borders[i].addComponent(number)
        }

    }

    // Add walls
    for (let i = 1; i < 16; i++) {
        buildWall(i, 0, 0.75)
        buildWall(0.75, 0, 16 - i)
        buildWall(i, 0, 15.25)
        buildWall(15.25, 0, 16 - i)
    }

    // Set first level
    reset()

    let user: any
    let username: any

    executeTask(async () => {
        let data = await getUserData()
        user = data?.userId
        username = data?.displayName
    })
    
    room.onMessage("changeHealth", (data) => {
        if (data == user && playerHealth > 0) {
            if (playerHealth < 15) {
                playerHealth = 0
                setLevel(4)
                room.send("dead")
            } else {
                playerHealth = playerHealth - 10
                playDisplay.value = "Player Health: " + playerHealth
                checkZero()
            }
            clicker = false
        }
        
    })

    let clicker: boolean = false

    onPlayerClickedObservable.add((e) => {
        room.send("clicked", e.userId)  
        clicker = true
    })

    room.onMessage("death", (data) => {
        if (clicker == true) {
            playerKills = playerKills + 1
            killDisplay.value = "Kills: " + playerKills
        }
    })

    const invisArea = new Entity()
    invisArea.addComponent(
        new AvatarModifierArea({
            area: { box: new Vector3(16, 4, 16) },
            modifiers: [AvatarModifiers.HIDE_AVATARS],
        })
    )
    invisArea.addComponent(
        new Transform({
            position: new Vector3(8, 0, 8),
        })
    )
    

    room.onMessage("levelChange1", (newLevel) => {
        room.send("levelReport", level)
        if (level == newLevel) {
            engine.removeEntity(invisArea)
        } else {
            engine.addEntity(invisArea)
        }
    })

    room.onMessage("levelChange2", (reportedLevel) => {
        if (level == reportedLevel) {
            engine.removeEntity(invisArea)
        } else {
            engine.addEntity(invisArea)
        }
    })

    room.onMessage("lost", (data) => {
        if (data[0] == user) {
            // Do nothing, already won
        } else {
            // Has lost
            playerHealth = 0
            setLevel(4)
        }
        let winShow = new UICanvas()
        let winDisplay = new UIText(winShow)
        winDisplay.hAlign = "center"
        winDisplay.vAlign = "center"
        winDisplay.value = "Winner: " + data[3] + " - " + data[1] + " Health, " + data[2] + " Kills"
        winDisplay.fontSize = 30
        winDisplay.positionX = -50
    })
    
    const modArea = new Entity()
    modArea.addComponent(
        new AvatarModifierArea({
            area: { box: new Vector3(16, 4, 16) },
            modifiers: [AvatarModifiers.DISABLE_PASSPORTS], 
        })
    )
    modArea.addComponent(
        new Transform({
            position: new Vector3(8, 0, 8),
        })
    )
    engine.addEntity(modArea)
     
})



