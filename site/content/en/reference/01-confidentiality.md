# Confidentiality

*What is encrypted, what the server sees, and what it cannot.*

## On your device

The eight words of a journal are turned into keys on your device; this takes about a second. Every line is encrypted with these keys before it leaves the device, with AES-GCM. The words themselves never leave the device and are never put into a link.

## On the server

The server keeps one file per journal: encrypted lines, one after another. It can tell how many lines there are, how large they are and when they were written. It cannot read a single one, and it holds no key with which it could. It stores no names, no e-mail addresses and no passwords.

To recognise who may read or write, the server gets tokens derived from the keys, not the keys themselves. To count how many people use a journal, it gets an identifier that is different for every journal and does not reveal who someone is.

## What follows from it

- Lost words cannot be restored, by nobody.
- Whoever has the words has the journal. Pass on only what is needed: the ally code to those who write, the guest code to those who read.
- Exports in plain text and calendar files are not encrypted; they are meant to leave the agenda.
- The copy in your browser lies encrypted with your PIN. Whoever reads out the storage of a stolen device could still try all PINs outside the app; a longer PIN makes that much slower. *Clear data in this browser* removes the copy.

## Checking it yourself

The code is public. The file on the server can be downloaded and inspected; the command-line tool reads it with the words, without the web app. The details are in the technical documentation (see *Troubleshooting*).
