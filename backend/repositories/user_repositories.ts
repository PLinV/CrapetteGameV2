import { executeQuery } from "./database"; 
import bcrypt from "bcrypt";

// a mettre dans le .env plus tard
const PEPPER = process.env.PEPPER || "CrapetteSecretPepper";

// ajouter un utilisateur (Inscription)
export async function addUser(username: string, mdp: string): Promise<boolean> {
  try {
    const mdpPoivre = mdp + PEPPER;
    const salt = await bcrypt.genSalt(10); // 
    const mdpHache = await bcrypt.hash(mdpPoivre, salt);

    // executeQuery renvoie maintenant directement les résultats (plus besoin de executeQueryArray)
    await executeQuery(
      "INSERT INTO users (username, password) VALUES ($1, $2);",
      [username, mdpHache]
    );
    
    console.log(`utilisateur ${username} ajouté avec succès`);
    return true;
  } catch (erreur) {
    console.error("erreur lors de l'ajout de l'utilisateur :", erreur);
    return false;
  }
}

// vérifier si un pseudo ou un email existe déjà
export async function userExist(username: string, email: string): Promise<boolean> {
  try {
    const resultat = await executeQuery(
      "SELECT id FROM users WHERE username = $1 OR email = $2;",
      [username, email]
    );

    // notre nouvelle fonction executeQuery renvoie un tableau (Array). On vérifie juste sa longueur.
    if (resultat.length > 0) {
      return true; // l'utilisateur existe déjà
    }
    return false;
  } catch (erreur) {
    console.error("Erreur lors de la vérification de l'utilisateur :", erreur);
    return true; // par sécurité, on bloque en cas d'erreur
  }
}

// vérifier les identifiants (Connexion)
export async function verifLogin(username: string, mdp: string): Promise<boolean> {
  try {
    const resultat = await executeQuery(
      "SELECT password FROM users WHERE username = $1;",
      [username]
    );

    if (resultat.length === 0) {
      return false; // pseudo introuvable
    }

    const mdpHacheDB = resultat[0].password; // on récupère le mot de passe haché
    const mdpPoivre = mdp + PEPPER;
    
    const motDePasseValide = await bcrypt.compare(mdpPoivre, mdpHacheDB);

    return motDePasseValide;
  } catch (erreur) {
    console.error("Erreur critique lors de la vérification du login :", erreur);
    return false;
  }
}

// récupérer un utilisateur par son pseudo
export async function getUserByUsername(username: string) {
  try {
    const result = await executeQuery(
      "SELECT id, username, email FROM users WHERE username = $1",
      [username]
    );

    if (result.length > 0) {
      return result[0];
    }
    return null;
  } catch (error) {
    console.error("Erreur lors de la récupération de l'utilisateur :", error);
    return null;
  }
}

// récupérer un utilisateur par son ID
export async function getUserById(id: number) {
  try {
    const result = await executeQuery(
      "SELECT id, username, email FROM users WHERE id = $1",
      [id]
    );

    if (result.length > 0) {
      return result[0];
    }
    return null;
  } catch (error) {
    console.error("Erreur lors de la récupération par id :", error);
    return null;
  }
}

// supprimer un compte
export async function deleteUser(id: number): Promise<boolean> {
  try {
    await executeQuery("DELETE FROM users WHERE id = $1", [id]);
    return true;
  } catch (error) {
    console.error("Erreur lors de la suppression de l'utilisateur :", error);
    return false;
  }
}