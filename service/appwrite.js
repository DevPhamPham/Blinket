import {
  Account,
  Avatars,
  Client,
  Databases,
  ID,
  Query,
  Storage,
} from "react-native-appwrite";


export const config = {
  endpoint: 'https://cloud.appwrite.io/v1',
  platform: 'com.blinket.blinket',
  projectId: '663b5dc1001ae1700945',
  databaseId: '663b5f39000b5ba9744a',
  userCollectionId: '663b5f60002a50fabca6',
  videoCollectionId: '663b5f9200296f0fe094',
  imageCollectionId: '664732200039084098d5',
  storageId: '663b61290031668d729e'
}

const {
  endpoint,
  platform,
  projectId,
  databaseId,
  userCollectionId,
  videoCollectionId,
  imageCollectionId,
  storageId
} = config

// Init your React Native SDK
const client = new Client();

client
  .setEndpoint(config.endpoint)
  .setProject(config.projectId)
  .setPlatform(config.platform);

const account = new Account(client);
const avatars = new Avatars(client);
const databases = new Databases(client);
const storage = new Storage(client);

export const createUser = async (email, password, username) => {
  try {
    const newAccount = await account.create(
      ID.unique(),
      email,
      password,
      username
    )

    if (!newAccount) throw Error;

    const avataUrl = avatars.getInitials(username)

    await signIn(email, password);

    const newUser = await databases.createDocument(
      config.databaseId,
      config.userCollectionId,
      ID.unique(),
      {
        accountId: newAccount.$id,
        email,
        username,
        avatar: avataUrl
      }
    )

    return newUser;
  } catch (error) {
    console.log(error);
    throw new Error(error);
  }
}

export const signIn = async (email, password) => {
  try {
    const session = await account.createEmailPasswordSession(email, password)

    return session
  } catch (error) {
    throw new Error(error);
  }
}

// Sign Out
export async function signOut() {
  try {
    const session = await account.deleteSession("current");

    return session;
  } catch (error) {
    throw new Error(error);
  }
}

// Get Account
export async function getAccount() {
  try {
    const currentAccount = await account.get();

    return currentAccount;
  } catch (error) {
    throw new Error(error);
  }
}

export const getCurrentUser = async () => {
  try {
    const currentAccount = await account.get();

    if (!currentAccount) throw Error;

    const currentUser = await databases.listDocuments(
      config.databaseId,
      config.userCollectionId,
      [Query.equal('accountId', currentAccount.$id)]
    )

    if (!currentUser) throw Error;

    return currentUser.documents[0]
  } catch (error) {
    console.log(error)
  }
}

export const getAllPosts = async () => {
  try {
    const posts = await databases.listDocuments(
      databaseId,
      videoCollectionId,
      [Query.orderDesc("$createdAt")]
    )

    return posts.documents;
  } catch (error) {
    throw new Error(error);
  }
}

export const getAllImage = async () => {
  try {
    const posts = await databases.listDocuments(
      databaseId,
      imageCollectionId,
      [Query.orderDesc("$createdAt")]
    )

    return posts.documents;
  } catch (error) {
    throw new Error(error);
  }
}

export const getLastestPosts = async () => {
  try {
    const posts = await databases.listDocuments(
      config.databaseId,
      config.videoCollectionId,
      [Query.orderDesc("$createdAt", Query.limit(7))]
    )

    return posts.documents;
  } catch (error) {
    throw new Error(error);
  }
}

export const searchPosts = async (query) => {
  try {
    const posts = await databases.listDocuments(
      config.databaseId,
      config.videoCollectionId,
      [Query.search("title", query)]
    )

    return posts.documents;
  } catch (error) {
    throw new Error(error);
  }
}

export const getUserPosts = async (userId) => {
  try {
    const posts = await databases.listDocuments(
      config.databaseId,
      config.videoCollectionId,
      [Query.equal("creator", userId)]
    )

    return posts.documents;
  } catch (error) {
    throw new Error(error);
  }
}

// Upload File
export async function uploadFile(file, type) {
  if (!file) return;

  const { mimeType, ...rest } = file;
  const asset = { type: mimeType, ...rest };

  console.log("ASSET: ", asset)

  try {
    const uploadedFile = await storage.createFile(
      config.storageId,
      ID.unique(),
      asset
    );

    console.log("UPLOADED: ", uploadedFile)

    const fileUrl = await getFilePreview(uploadedFile.$id, type,file.width,file.height);
    return fileUrl;
  } catch (error) {
    throw new Error(error);
  }
}

// Get File Preview
export async function getFilePreview(fileId, type,width,height) {
  let fileUrl;

  try {
    if (type === "video") {
      fileUrl = storage.getFileView(config.storageId, fileId);
    } else if (type === "image") {
      const widthImage = width??3000
      const heightImage = height??4000
      fileUrl = storage.getFilePreview(
        config.storageId,
        fileId,
        widthImage,
        heightImage,
        "top",
        100
      );
    } else {
      throw new Error("Invalid file type");
    }

    if (!fileUrl) throw Error;

    console.log("fileUrl: ", fileUrl);

    return fileUrl;
  } catch (error) {
    throw new Error(error);
  }
}

// Create Video Post
export async function createVideoPost(form) {
  try {
    const [thumbnailUrl, videoUrl] = await Promise.all([
      uploadFile(form.thumbnail, "image"),
      uploadFile(form.video, "video"),
    ]);

    const newPost = await databases.createDocument(
      config.databaseId,
      config.videoCollectionId,
      ID.unique(),
      {
        title: form.title,
        thumbnail: thumbnailUrl,
        video: videoUrl,
        prompt: form.prompt,
        creator: form.userId,
      }
    );

    return newPost;
  } catch (error) {
    throw new Error(error);
  }
}

// Create Video Post
export async function createImagePost(form) {
  try {
    const imageUrl = await uploadFile(form.image, "image");

    console.log("imageUrl: ", imageUrl);

    const newPost = await databases.createDocument(
      config.databaseId,
      config.imageCollectionId,
      ID.unique(),
      {
        title: form.title,
        image: imageUrl,
        creator: form.userId,
      }
    );

    return newPost;
  } catch (error) {
    throw new Error(error);
  }
}

// Delete File
export async function deleteFile(data) {

  try {
    Promise.all([
      await storage.deleteFile(
        data.bucketIdThumbnail, // bucketId
        data.fileIdThumbnail // fileId
      ),
      await storage.deleteFile(
        data.bucketIdVideo, // bucketId
        data.fileIdVideo // fileId
      )
    ])

  } catch (error) {
    throw new Error(error);
  }
}

export async function deletePost(data) {
  const docId = data["docId"];

  try {
    // Xóa tài liệu thay vì lấy tài liệu
    const result = await databases.getDocument(
      config.databaseId,
      config.videoCollectionId,
      docId // documentId
    );

    bucketIdThumbnail = result["thumbnail"].split("/buckets/")[1].split('/')[0]
    fileIdThumbnail = result["thumbnail"].split("/files/")[1].split('/')[0]
    bucketIdVideo = result["video"].split("/buckets/")[1].split('/')[0]
    fileIdVideo = result["video"].split("/files/")[1].split('/')[0]
    await deleteFile({
      bucketIdThumbnail,
      fileIdThumbnail,
      bucketIdVideo,
      fileIdVideo
    });

    await databases.deleteDocument(
      config.databaseId,
      config.videoCollectionId,
      docId // documentId
    );
  } catch (error) {
    console.error("Error deleting document:", error);
    throw error; // Ném lại lỗi để xử lý ở hàm gọi
  }
}

