import { Schema, Context, MapSchema, ArraySchema, type } from "@colyseus/schema";
import { Client } from "colyseus";


export class Player extends Schema {

    @type('string') id: string
    @type('number') numid: number
    @type('number') level: number
    @type('number') kills: number
    @type('number') playerHealth: number
    client: Client

    constructor(id: string, nid: number, level: number, kills: number, health: number, client: Client) {
        super()
        this.id = id
        this.numid = nid
        this.level = level
        this.kills = kills
        this.playerHealth = health
        this.client = client
    }

    getHealth() {
        return this.playerHealth
    }
}

export class MyRoomState extends Schema {

    @type("string") mySynchronizedProperty: string = "Hello world";
    @type({ map: Player }) players = new MapSchema<Player>()
    @type([Player]) playersList = new ArraySchema<Player>()
    
}