# Labyrinth

My own HTML5/JavaScript single-player version of the paper-and-pencil game of the [same name](https://en.wikipedia.org/wiki/Labyrinth_(paper-and-pencil_game)). A little challenge/fun personal project I made for myself.

## Gameplay
The core gameplay is quite simple: you are in a maze, the details of which are mostly unknown to you. You know that there is treasure in the maze and an exit. Your goal is to get the treasure and escape the maze.

Now that would be all fine and dandy if it weren't for the obstacles in the maze. Wormholes send you zipping to other parts of the maze while rivers carry you or items to different parts. There's even traps to kill you and fake treasure to fool you.

On top of all of that, there are other players (AIs in this version) with the same goal in mind, and you don't know where they're at. You can use clues from what they do to figure out where they are. Also, you are equipped with some weapons to slow down the progress of these players: a gun with some ammunition that you can shoot down a corridor; a knife you can use to hurt players in the same space as you; and some grenades to blow up walls. However, so are they.

Each player has two health and limited weapon-use. Throughout the maze are occasional "hospitals" where you can heal up and "arsenals" where you can restock on weapons. It is important to keep your health up as you cannot carry treasure if you are not at full health!

## Notes

I randomly found this game on Wikipedia and thought it would make a nice challenge/personal project.

***THIS GAME IS CURRENTLY UNFINISHED**, just uploading my current progress right now. Unplayable as of right now.* Currently, most of what I've said so far isn't even implemented. All I have right now is an HTML wrapper around an intentionally imperfect maze generator.

Here is an example maze generated by the program with some players (colored dots), wormholes (W's), and treasure (T):
![Example maze generated by program](https://user-images.githubusercontent.com/58670911/161474491-073d5c74-23eb-44b3-be7b-18a2a2aba768.png)

Here are some resources I've been using to help with specifications and ideas to add:
- https://en.wikipedia.org/wiki/Labyrinth_(paper-and-pencil_game)
- https://thejam.ru/igry-na-bumage/labirint-dlya-dvux-igrokov.html (Russian)
- https://thejam.ru/igry-na-bumage/labirint.html (Russian)
- https://www.thegamecrafter.com/games/terra-incognita