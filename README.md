# password-manager 
## short answer questions 



1.	Briefly describe your method for preventing the adversary from learning information about the lengths of the passwords stored in your password manager.

Password Length Obfuscation: Employ techniques like padding passwords with random bits before encryption. This conceals the original password lengths from the adversary.

2.	Briefly describe your method for preventing swap attacks (Section 2.2). Provide an argument for why the attack is prevented in your scheme.
   
 * Swap Attack Prevention: Implement cryptographic message authentication codes (CMACs) on password updates. CMACs depend on both the data and a secret key, ensuring data integrity and preventing unauthorized modifications (swaps).

   
3.	In our proposed defense against the rollback attack (Section 2.2), we assume that we can store the SHA-256 hash in a trusted location beyond the reach of an adversary. Is it necessary to assume that such a trusted location exists, in order to defend against rollback attacks? Briefly justify your answer.

 * Trusted Location for Rollback Defense: No, a trusted location isn't strictly necessary. You can leverage timestamps or sequence numbers with CMACs to detect rollbacks. CMACs will change if the data or sequence is tampered with
   
4.	Because HMAC is a deterministic MAC (that is, its output is the same if it is run multiple times with the same input), we were able to look up domain names using their HMAC values. There are also randomized MACs, which can output different tags on multiple runs with the same input. Explain how you would do the look up if you had to use a randomized MAC instead of HMAC. Is there a performance penalty involved, and if so, what?
	
 * Lookup with Randomized MACs: Use a password-derived key (PBKDF2) to derive multiple keys: one for encryption and another for generating randomized MAC tags. Store these tags along with the encrypted passwords. During lookup, regenerate the MAC tag using the same key and compare it to the stored value. This ensures authenticity despite the randomized MAC output. There might be a slight performance overhead due to the additional key derivation.
   
5.	In our specification, we leak the number of records in the password manager. Describe an approach to reduce the information leaked about the number of records. Specifically, if there are k records, your scheme should only leak log2(k) (that is, if k1 and k2 are such that log2(k1)   =   log2(k2) , the attacker should not be able to distinguish between a case where the true number of records is k1 and another case where the true number of records is k2).

 Reducing Information Leakage on Number of Records: Implement a technique like blind indexing using a public key cryptosystem. The password manager can use its private key to create opaque pointers to records without revealing the number of records.z
 

6.	What is a way we can add multi-user support for specific sites to our password manager system without compromising security for other sites that these users may wish to store passwords of? That is, if Alice and Bob wish to access one stored password (say for nytimes) that either of them can get and update, without allowing the other to access their passwords for other websites.

Introduce a concept of "shared folders" within the password manager. Alice and Bob can create a shared folder specifically for the NYT password and grant each other access to that folder only. This way, they can manage the shared password while keeping other passwords private.
