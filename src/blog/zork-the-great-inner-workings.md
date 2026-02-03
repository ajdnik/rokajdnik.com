---
slug: zork-the-great-inner-workings
title: "Zork: The Great Inner Workings"
description: "Exploring the source code and game architecture of Zork, one of the most influential text-based adventure games ever created."
date: 2020-07-05
author: "Rok Ajdnik"
tags: ["gaming", "programming", "retro"]
featured: true
editable: false
canonical: "https://medium.com/swlh/zork-the-great-inner-workings-b68012952bdc"
cover:
  src: "/images/blog/zork-the-great-inner-workings/cover.webp"
  alt: "Zork cover art inside the matrix"
  caption: "Zork cover art inside the matrix. Zork cover art is the copyright of Infocom and The Matrix code is the copyright of Warner Bros. Pictures."
---

Roughly a year ago, during the summer of 2019, I got an idea. I was setting up a [Kubernetes](https://en.wikipedia.org/wiki/Kubernetes) cluster, and as I usually do, I set up a mock web server using [Nginx](https://en.wikipedia.org/wiki/Nginx) to test out [Ingress](https://kubernetes.io/docs/concepts/services-networking/ingress/), [SSL](https://en.wikipedia.org/wiki/Transport_Layer_Security), and domain settings. Then it hit me, wouldn't it be great if instead of a boring webserver I would use a web game as my testing service and then leave it in the cluster as sort of a calling card. I know, I can be childish, sometimes. If you're unfamiliar with Kubernetes, Nginx and SSL, don't worry, they have nothing to do with Zork. I'm just trying to rationalize the madness of going through and studying over 15 thousand lines of code that comprise the game of Zork. Which I did because I thought implementing Zork as a web game would be easy. Little did I know…

After studying a bit about the history of Zork I came across an interesting coincidence. Even though the game was sold on disks and played on personal computers, the original version, which wasn't sold commercially, was also played "online", although back then they used the [ARPANet](https://en.wikipedia.org/wiki/ARPANET). Other users of ARPANet would log in to the mainframe the developers used to build Zork and play the game. If you're curious more about the history of Zork and what the game is about I suggest you read my first article on the subject [Zork: The Great Underground Empire](/zork-the-great-underground-empire).

In this article, I'll explain how I went about studying the Zork source code and how the game's architecture and mechanisms worked.

## Game's Versions

Before delving into the architecture and source code it's worth noting that Zork had many incarnations and while the general architecture is the same across all of them, they differ in how that architecture was implemented.

The first version of Zork was written from 1977 to 1979 and was developed in [MDL](https://en.wikipedia.org/wiki/MDL_(programming_language)), which was a functional language similar to [LISP](https://en.wikipedia.org/wiki/Lisp_(programming_language)). The game was developed exclusively for the [PDP-10](https://en.wikipedia.org/wiki/PDP-10) mainframe computer.

In 1978 some "madman"¹ ported the source code into [FORTRAN](https://en.wikipedia.org/wiki/Fortran) which is an imperative programming language. That version was initially developed for the [PDP-11](https://en.wikipedia.org/wiki/PDP-11) mainframe but got compiled on numerous other systems since FORTRAN was much more portable than MDL.

In 1981 the [original Zork developers](https://en.wikipedia.org/wiki/Implementer_(video_games)) decided to create a game development company and distribute Zork as their first game. Due to limitations, which you can read about in the first article, they had to separate Zork into three games, Zork I, II, and III. They also invented their own programming language [ZIL](http://www.ifwiki.org/index.php/ZIL) which was similar to MDL but was more portable which meant they were able to run Zork on [TRS-80](https://en.wikipedia.org/wiki/TRS-80) and [Apple II](https://en.wikipedia.org/wiki/Apple_II) computers.

[Infocom](https://en.wikipedia.org/wiki/Infocom), which was the name of the company, made improvements to the Zork codebase over the years, such as fixing bugs. They also released Gold editions of Zork which contained in-game hints and in 1987 they released Mini-Zork which was an abridged version.

For this article, I went through the code of Zork I, which was a commercially released game. But the architecture remained the same for every Zork variant.

## Research

I immediately started searching the web for any Zork source. Due to sheer dumb luck the entire Zork I [codebase](https://github.com/historicalsource/zork1) was released on GitHub a couple of months earlier in April 2019. The code was released by [historicalsource](https://github.com/historicalsource) along with source codes for other older video games. Of course, the code was written in ZIL, which meant I had to find documentation on the language and what the builtin functions did. Thankfully I found another GitHub user [Jeff Nyman](https://github.com/jeffnyman) who collected ZIL and [Z-machine](https://en.wikipedia.org/wiki/Z-machine) manuals in his [zmachine](https://github.com/jeffnyman/zmachine) repository.

Thanks to the source code and the manuals I was able to brute-force my way through Zork I and bit by bit I started understanding what the code does. The lack of comments and nondescript variable names made the job more difficult. The most challenging part of the code was the parser, which converted the player's input into game commands. Thanks to the manuals I was able to find crucial clues, that helped me decode the source. Those clues were what the variables PRSA, PRSI, and PRSO referred to. These three variables are one of the most common and important variables in the entire Zork code base, they have a global scope, and the developers decided to use four letters to represent them, no comment...

In May 2020, [MIT](https://en.wikipedia.org/wiki/Massachusetts_Institute_of_Technology) released the [source code](https://github.com/MITDDC/zork) of the original Zork game written between 1977 and 1979. Studying the code I realized that, besides containing a bigger storyline that contains all three Zork games, the architecture of the game is very similar to the game they released commercially in 1981. Oh, and I looked at the FORTRAN [source code](https://github.com/historicalsource/zork-fortran) but I gave up quickly.

## The Inner Workings

The easiest way to describe the game's architecture is to describe how the game parses the player's input. Players can ask the game to do all kinds of things:

```
>examine the small mailbox
The small mailbox is closed.

>look at the glass bottle
The glass bottle contains:
A quantity of water

>attack the nasty-looking troll with the garlic
Trying to attack the troll with a clove of garlic is suicidal.
The flat of the troll's axe skins across your forearm.

>burn down the white house with the lantern
With a brass lantern??!?

>attack the mailbox with the elvish sword
I've known strange people, but fighting a small mailbox?
```

The game parses the player's input into three main variables PRSA, PRSI, and PRSO. The variables refer to an action, indirect object, and direct object respectively. A direct object is an object that the action acts upon, and an indirect object is an optional part of a sentence; it's the recipient of the action. The parser's job is to figure out which parts of the player's input are the PRSA, PRSI, and PRSO.

<figure>
  <img src="/images/blog/zork-the-great-inner-workings/command-breakdown.webp" alt="Breakdown of a command into the three main parsing variables" />
  <figcaption>Breakdown of a command into the three main parsing variables.</figcaption>
</figure>

For the sake of completionism and to further demonstrate how the parser works, here's how it would determine the three variables for the player inputs shown above.

```
>examine the small mailbox
PRSA="examine" PRSO="small mailbox"

>look at the glass bottle
PRSA="look at" PRSO="glass bottle"

>attack the nasty-looking troll with the garlic
PRSA="attack" PRSO="nasty-looking troll" PRSI="garlic"

>burn down the white house with the lantern
PRSA="burn down" PRSO="white house" PRSI="lantern"

>attack the mailbox with the elvish sword
PRSA="attack" PRSO="mailbox" PRSI="elvish sword"
```

To be fully transparent, this is only a simplified description of how the parser works. But it's enough to explain the next mechanism that comprises the game's architecture which is **a game object**.

<figure>
  <img src="/images/blog/zork-the-great-inner-workings/mailbox.webp" alt="Zork I ZIL source code definition of the MAILBOX object" />
  <figcaption>Zork I ZIL source code definition of the MAILBOX object.</figcaption>
</figure>

Game objects can be anything, from a location such as the [White House](https://zork.fandom.com/wiki/White_house) to objects such as the [Mailbox](https://zork.fandom.com/wiki/Mailbox), essentially everywhere the player can go, anything they can take or attack with, everything is a game object. Each object has properties such as a name, a description, an action, a list of adjectives that describe it, etc.

<figure class="full-width">
  <img src="/images/blog/zork-the-great-inner-workings/white-house.webp" alt="Object definition of the WHITE-HOUSE object and its action definition" />
  <figcaption>Object definition of the WHITE-HOUSE object and its action definition (WHITE-HOUSE-F) on the right.</figcaption>
</figure>

Each object has an action property. That property contains a callback function that gets executed if the object is referenced in the player's input. When the action is executed, it normally outputs text to the player based on the context in which the object was referenced in the player's input. For instance, based on the code above, if the player is located in the kitchen, living room or the attic and they type the command `>find the white house` the game will output `Why not find your brains?`. The logic for that particular case is located in the *WHITE-HOUSE-F* action on lines 2–4. The game's response is witty since the player is already located within the house, so trying to find it is pointless. Below are some more examples of the player's input and how that input would be handled with the *WHITE-HOUSE-F* action.

```
West of House
You are standing in an open field west of a white house, with a boarded front door.
There is a small mailbox here.

>examine the beautiful house
The house is a beautiful colonial house which is painted white. It is clear that the owners must have been extremely wealthy.

>burn down the house with the lantern
You must be joking.

>find the white house
It's right here! Are you blind or something?
```

All the objects are located in **the object tree** which is a hierarchical data structure where the parent objects represent owners of their node objects. Essentially, if one object has a parent it means the object is located in/on its parent. An example would be if an object called "quantity of water" were located within an object called "glass bottle", the bottle object would be the parent of the water object, as shown in the image below. The parent object is defined in the *IN* property of the object. The *KITCHEN* object has a parent called ROOMS which isn't shown below. It's a top-level object within the object tree that contains all the game's rooms.

<figure>
  <img src="/images/blog/zork-the-great-inner-workings/object-tree.webp" alt="Excerpt from the object tree showing how the hierarchy defines the object's placement within the game" />
  <figcaption>Excerpt from the object tree showing how the hierarchy defines the object's placement within the game.</figcaption>
</figure>

What this hierarchy means is that the *WATER* object is located in the *BOTTLE* object which is located on the *KITCHEN-TABLE* object, and lastly the *KITCHEN-TABLE* is located in the *KITCHEN* object which is also a room. Here's how this tree structure translates into the game's output. Some of the output below is defined in the object's actions and isn't seen in the definitions above.

```
Kitchen
You are in the kitchen of the white house. A table seems to have been used recently for the preparation of food. A passage leads to the west and a dark staircase can be seen leading upward. A dark
chimney leads down and to the east is a small window which is open.
A bottle is sitting on the table.
The glass bottle contains:
A quantity of water
On the table is an elongated brown sack, smelling of hot peppers.
```

The parser uses the game's object tree to locate relevant objects which were referenced in the player's input. Once the algorithm unambiguously determines which object or objects were referenced in the input the variables PRSO and PRSI are populated with those objects. And lastly, the parser needs to populate the PRSA variable but for that, it uses another mechanism called **the syntax**.

<figure class="full-width">
  <img src="/images/blog/zork-the-great-inner-workings/attack-syntax.webp" alt="Syntax definition for the ATTACK action" />
  <figcaption>Syntax definition for the ATTACK action.</figcaption>
</figure>

The syntax is a table structure where Zork defines its actions. As seen in the source code above it uses a format: "Verb preposition Direct object preposition Indirect object", where prepositions and objects are optional.

<figure class="full-width">
  <img src="/images/blog/zork-the-great-inner-workings/look-syntax.webp" alt="Syntax definitions for LOOK actions taken from Zork I ZIL source" />
  <figcaption>Syntax definitions for LOOK actions taken from Zork I ZIL source.</figcaption>
</figure>

The snippet above shows different syntax definitions for the *LOOK* action. Some have objects and prepositions defined while others don't. Each syntax also has a callback function defined (*V-LOOK*, *V-EXAMINE*, *V-LOOK-INSIDE*, …). The callback functions are similar to object actions, meaning they get executed if the syntax is matched to the player's input. The attack syntax example, shown above, can be broken down as follows:

<figure class="full-width">
  <img src="/images/blog/zork-the-great-inner-workings/attack-syntax-breakdown.webp" alt="Breakdown of ATTACK syntax definition" />
  <figcaption>Breakdown of ATTACK syntax definition.</figcaption>
</figure>

Once the parser finds PRSO and PRSI and determines the verb in the player's input, it starts looking through the syntax table for an entry that matches the verb, as well as PRSO/PRSI combination. The flags that are defined for each object put restrictions on what kind of objects can be used in that syntax. In the case of the attack action above, the direct object needs to be a game character (*ACTORBIT*) such as a troll or a thief, and the indirect object needs to be a weapon and based on its location flags (*HELD*, *CARRIED*, *HAVE*) it needs to be in the possession of the player.

If the syntax structure matches the player's input and PRSO and PRSI match based on the flags defined in the syntax, then that syntax is set to PRSA and the parser has completed its job. After parsing the game executes specific in-game actions based on the values of PRSA, PRSO, and PRSI. The pseudo-code shown below demonstrates the general algorithm.

<figure>
  <img src="/images/blog/zork-the-great-inner-workings/action-execution.webp" alt="Approximation of the action execution logic written in Python" />
  <figcaption>Approximation of the action execution logic written in Python.</figcaption>
</figure>

After the game executes those actions and outputs the results it loops back to obtaining new player input and the loop continues. The diagram, shown below, demonstrates a simplified loop where the player inputs text which gets parsed into PRSA, PRSO, and PRSI by using the object tree and syntax table structures. And lastly, syntax or game object actions get executed which results in text being printed out to the player.

<figure class="full-width">
  <img src="/images/blog/zork-the-great-inner-workings/game-loop.webp" alt="Simplified Zork I game loop" />
  <figcaption>Simplified Zork I game loop.</figcaption>
</figure>

The output that gets printed out is from the *V-ATTACK* action. It gets printed because the *MAILBOX* object doesn't have the *ACTORBIT* flag which is required to successfully execute an attack on something. In simpler terms, because the *MAILBOX* object isn't a game character it can't be attacked and the *V-ATTACK* action outputs a witty retort.

This description is a somewhat simplified architecture because it doesn't take into account a synonym table, part-of-speech tagging, and the fact that the parser supports clauses. I recommend reading through the source code and manuals to get a more detailed understanding of the architecture. But the description provided in this article should be a good starting off point when it comes to exploring the game's architecture and its source code.

## Exploring the Source Code

Now that we have a general understanding of how the game works let's look at its source code.

<figure>
  <img src="/images/blog/zork-the-great-inner-workings/github.webp" alt="Zork I GitHub repository files" />
  <figcaption>Zork I GitHub repository files.</figcaption>
</figure>

Looking at the file structure above, any software engineer could make a reasonable guess that the game starts in gmain.zil since main is a common software [entry point](https://en.wikipedia.org/wiki/Entry_point). They would be wrong. The game execution starts in the [*GO*](https://github.com/historicalsource/zork1/blob/master/1dungeon.zil#L2637) function which is located in 1dungeon.zil. The function takes care of some setup logic and in the end starts the game's main loop, whose function is located in gmain.zil.

<figure>
  <img src="/images/blog/zork-the-great-inner-workings/go-entrypoint.webp" alt="The entry point to the Zork I game" />
  <figcaption>The entry point to the Zork I game.</figcaption>
</figure>

The [*MAIN-LOOP*](https://github.com/historicalsource/zork1/blob/master/gmain.zil#L38) function essentially performs the loop I described in the previous chapter, where the player's input is parsed and the game finds the appropriate syntax and game objects being referred to in said input. Afterward, actions for the matching syntax and game objects are executed. The *MAIN-LOOP* calls the [*PARSER*](https://github.com/historicalsource/zork1/blob/master/gparser.zil#L109) function to parse the input and afterward, it executes the actions by calling the [*PERFORM*](https://github.com/historicalsource/zork1/blob/master/gmain.zil#L235) function. The *PARSER* function is located in gparser.zil along with a ton of helper functions and the *PERFORM* function is located in gmain.zil.

Besides the main game logic, game object definitions are located in 1dungeon.zil, the object's action definitions are located in 1actions.zil, syntax definitions are located in gsyntax.zil and syntax's action definitions are located in gverbs.zil. Lastly, gclock.zil contains a rudimentary implementation of a timer mechanism that the game uses to trigger time-based events. That covers all the major aspects of the game. Other files contain helper functions and additional game object definitions.

The repository also contains a compiled version of the game in [z3](https://fileinfo.com/extension/z3) format. You can run the game using one of the many [Z-machine](https://en.wikipedia.org/wiki/Z-machine) interpreters out there. I recommend [Frotz](https://davidgriffith.gitlab.io/frotz/).

Now, let's look at some of the more interesting aspects of Zork's source code. Firstly, let's start with the [xyzzy](https://en.wikipedia.org/wiki/Xyzzy_(computing)) easter egg. The *XYZZY* command was added to Zork as an easter egg or a nod to the [Colossal Cave Adventure](https://en.wikipedia.org/wiki/Colossal_Cave_Adventure), which was the first text-based adventure game.

<figure>
  <img src="/images/blog/zork-the-great-inner-workings/xyzzy.webp" alt="XYZZY syntax definition" />
  <figcaption>XYZZY syntax definition.</figcaption>
</figure>

Executing the command at any point in the game would always produce the same response:

```
>xyzzy
A hollow voice says "Fool."
```

Another interesting find is the inclusion of the *RAPE* command. Yes, you're reading that correctly, it's not a typo. The command didn't really do anything and was most likely put there by the authors for comedic effect, but it's certainly something that wouldn't be found in today's games.

<figure>
  <img src="/images/blog/zork-the-great-inner-workings/rape.webp" alt="RAPE command syntax definition" />
  <figcaption>RAPE command syntax definition.</figcaption>
</figure>

Again, similar to the *XYZZY* command the player could execute the command at any point in-game and receive the same response.

```
West of House
You are standing in an open field west of a white house, with a boarded front door.
There is a small mailbox here.

>rape the mailbox
What a (ahem!) strange idea.
```

To me, especially considering the problems in the present gaming culture², the command is an interesting window into the gaming culture of the past and how this cultural behavior got passed on to the newer generations and potentiated.

One piece of source code I have to address is something the gaming community already discovered back in 2017³. Back then they didn't have access to the original ZIL code so they used the decompiled Z-code to decode this trolling logic. The game has an interesting inventory management logic. Essentially whenever a player tries to put an object into their inventory the [*ITAKE*](https://github.com/historicalsource/zork1/blob/master/gverbs.zil#L1900) function is executed.

<figure>
  <img src="/images/blog/zork-the-great-inner-workings/itake.webp" alt="Games TAKE logic" />
  <figcaption>Games TAKE logic.</figcaption>
</figure>

The function checks if the item can be safely put into the player's inventory. It does this by performing five checks where if one of them fails the object can't be taken by the player. On line 3 it checks if the player is dead, on line 7 it checks if the object can be taken, on line 11 it checks if the object is located within a closed container, on line 15 it checks if the item exceeds the inventory load allowed, and then the pièce de résistance, on line 25 it checks the number of items currently held in inventory and if that number is greater than 7 it randomly returns "You're holding too many things already!". What this means is that during gameplay if you see this response you can retry taking it and if the random number generator is on your side you'll be able to pick it up. Using the randomness approach, the developers successfully trolled the game's players into guessing what the maximum number of items they could carry was.

```
>go north
Studio
This appears to have been an artist's studio. The walls and floors are splattered with paints of 69 different colors. Strangely enough, nothing of value is hanging here. At the south end of the room
is an open door (also covered with paint). A dark and narrow chimney leads up from a fireplace; although you might be able to get up it, it seems unlikely you could get back down.
Loosely attached to a wall is a small piece of paper.
A "lean and hungry" gentleman just wandered through, carrying a large bag. Finding nothing of value, he left disgruntled.

>inventory
You are carrying:
A nasty knife
A rope
A sword
A brass lantern (providing light)
A brown sack
A lunch
A clove of garlic
A glass bottle
The glass bottle contains:
A quantity of water

>take paper
You're holding too many things already!

>take paper
Taken.
```

Besides easter eggs, inappropriate game commands, and trolling game mechanics, the source code also contains interesting comments. Some of the comments show unused code which was commented out, and other comments show how developers tracked changes before [source version control](https://en.wikipedia.org/wiki/Version_control) became popular.

<figure>
  <img src="/images/blog/zork-the-great-inner-workings/comments.webp" alt="Change tracking using comments" />
  <figcaption>Change tracking using comments.</figcaption>
</figure>

This source code excerpt was taken from [*GET-OBJECT*](https://github.com/historicalsource/zork1/blob/master/gparser.zil#L1040) function located in gparser.zil. We can also make an educated guess that MARC refers to [Marc Blank](https://en.wikipedia.org/wiki/Marc_Blank), who was one of the initial creators of Zork, but I couldn't figure out who JW could be.

The entire Zork I codebase consists of more than 15k lines of code so there are plenty more interesting comments, curious game logic, and offensive humor to be found. But we've gone through plenty in this article.

## Summary

Exploring and examining the Zork I source code gave me the knowledge and confidence needed to port the game into a modern programming language. I've started porting the game into [Golang](https://en.wikipedia.org/wiki/Go_(programming_language)) and you can check out my project on [GitHub](https://github.com/ajdnik/gozork). It's still a work in progress and while I've ported the parser and the syntax I still have a lot of work to do. After I finish porting it to Golang I might rebuild the game in [React](https://en.wikipedia.org/wiki/React_(web_framework))/[Redux](https://en.wikipedia.org/wiki/Redux_(JavaScript_library)), I'm curious if a game such as this could be built entirely in a Redux architecture.

---

## References

1. Tim Anderson. New Zork Times, pages 6–7, 11. (Winter 1985). *The History of Zork, First in a Series*
2. Mark Melnychuk. Regina Leader-Post. (Nov 25, 2014). *The word rape is sadly engrained in gaming culture* [https://leaderpost.com/entertainment/the-word-rape-is-sadly-engrained-in-gaming-culture](https://leaderpost.com/entertainment/the-word-rape-is-sadly-engrained-in-gaming-culture)
3. Logan Booker. Kotaku. (August 28, 2017). *Zork Source Code Is A Master Class In Game Developer Trolling* [https://www.kotaku.com.au/2017/08/zork-source-code-is-a-master-class-in-game-developer-trolling/](https://www.kotaku.com.au/2017/08/zork-source-code-is-a-master-class-in-game-developer-trolling/)
