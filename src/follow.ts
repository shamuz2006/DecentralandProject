import { Client } from "colyseus.js"
import * as utils from '@dcl/ecs-scene-utils'

// GLobals
let player = Camera.instance

// Boundaries for monsters
const Xmax = 16 - 3
const Xmin = 3
const Zmax = 16 - 3
const Zmin = 3


// Follow player component
@Component("FollowsPlayer")
export class FollowsPlayer {
}

// Follow sytem
class PlayerFollowSystem {

    group = engine.getComponentGroup(FollowsPlayer)

    update(dt: number) {
        for (let entity of this.group.entities) {

            let transform = entity.getComponent(Transform)

            let moveDirection = player.position.subtract(transform.position)

            moveDirection = moveDirection.normalize().multiplyByFloats(1.5 * dt, 1.5 * dt, 1.5 * dt)

            let futurePos = transform.position.add(moveDirection)

            // check first and restrict if necessary to prevent going out of bounds
            if (futurePos.x > Xmax || futurePos.x < Xmin) {
                futurePos.x = transform.position.x
            }
            if (futurePos.z > Zmax || futurePos.z < Zmin) {
                futurePos.z = transform.position.z
            }

            transform.position.copyFrom(futurePos)

            transform.lookAt(player.feetPosition)



        }
    }
}


// Add system for following and multiplayer attack
engine.addSystem(new PlayerFollowSystem())
