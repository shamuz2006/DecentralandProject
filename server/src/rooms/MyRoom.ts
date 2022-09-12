import { Room, Client } from "colyseus";
import { MyRoomState, Player } from "./schema/MyRoomState";

export class MyRoom extends Room<MyRoomState> {
 

  onCreate (options: any) {
    this.setState(new MyRoomState());

    this.onMessage("clicked", (client, message) => {
        const player = this.state.players.get(client.sessionId)
        let players = this.state.playersList
        this.broadcast("changeHealth", message)
        
    })

    this.onMessage("newLevel", (client, message) => {
        this.broadcast("levelChange1", message)
    })

    this.onMessage("levelReport", (client, message) => {
        this.broadcast("levelChange2", message)
    })

      this.onMessage("dead", (client, message) => {
          this.broadcast("death", message)
      })

    this.onMessage("win", (client, message) => {
        this.broadcast("lost", message)
    })

  }

  onJoin(client: Client, options: any) {
      let numberPlayers = this.state.playersList.length + 1
      console.log(client.id, "joined!");
      const newPlayer = new Player(client.id, numberPlayers, 1, 0, 200, client)
      this.state.playersList.push(newPlayer)
      this.state.players.set(client.sessionId, newPlayer)
      console.log(this.state.playersList[numberPlayers - 1].id)
  }

  onLeave (client: Client, consented: boolean) {
      const player = this.state.players.get(client.sessionId)
      console.log(client.sessionId, "left!");
      this.state.playersList.splice(this.state.playersList.indexOf(player))
  }

  onDispose() {
    console.log("room", this.roomId, "disposing...");
  }

}
