const SocialPost = require('../../models/mongo/socialPost');

exports.createPost = async (req, res) => {
  
  try {
    const { content, isArticle, articleTitle,urlFile, links = [] , idUser} = req.body;

    // Convertir les liens en tableau si c'est une string
    const linksArray = typeof links === 'string' ? [links] : links;

    const post = new SocialPost({
      content,
      idUser: String(idUser),
      isArticle: !!isArticle,
      ...(isArticle && { articleTitle }),
      files: urlFile.filter(Boolean).map(url => ({ url })),
      links: linksArray.filter(Boolean).map(url => ({ url })),
      reactions: [], 
      comments: []  
    });

    await post.save();
    res.status(201).json(post);
  } catch (error) {
    res.status(500).json({ 
      error: 'Erreur création post',
      details: error.message 
    });
  }
};

exports.getPosts = async (req, res) => {
  try {
    const posts = await SocialPost.aggregate([
      { $sort: { createdAt: -1 } },
      {
        $lookup: {
          from: 'users', // nom de la collection MongoDB (souvent 'users')
          localField: 'idUser',
          foreignField: 'idUser',
          as: 'user'
        }
      },
      { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          content: 1,
          idUser: 1,
          isArticle: 1,
          articleTitle: 1,
          files: 1,
          links: 1,
          createdAt: 1,
          updatedAt: 1,
          reactions: 1,
          comments: 1,
          user: {
            userName: 1,
            avatar: 1,
            surname: 1,
            roleUser: 1,
            statusUser: 1
          }
        }
      }
    ]);
    res.json(posts);
  } catch (error) {
    res.status(500).json({ 
      error: 'Erreur récupération posts',
      details: error.message 
    });
  }
};

// POST /social/posts/:postId/reaction
exports.addReaction = async (req, res) => {
  try {
    const { postId } = req.params;
    const { type, userId } = req.body;
    const post = await SocialPost.findById(postId);
    if (!post) return res.status(404).json({ error: "Post non trouvé" });

    if (!post.reactions) post.reactions = [];
    const existingReaction = post.reactions.find(r => r.userId === userId);
    if (existingReaction) {
      existingReaction.types = type;
    } else {
      post.reactions.push({ userId, types: type });
    }

    await post.save();
    res.json(post.reactions);
  } catch (error) {
    res.status(500).json({ error: "Erreur lors de la réaction au post" });
  }
};

// POST /social/posts/:postId/comment
exports.addComment = async (req, res) => {
  const { postId } = req.params;
  const { content , userId } = req.body; 
  const post = await SocialPost.findById(postId);
  post.comments.push({ userId, content });
  await post.save();
  res.json(post.comments);
};

// POST /social/posts/:postId/comment/:commentId/reaction
exports.addCommentReaction = async (req, res) => {
  try {
    const { postId, commentId } = req.params;
    const { type, userId } = req.body;
    const post = await SocialPost.findById(postId);
    if (!post) return res.status(404).json({ error: "Post non trouvé" });

    const comment = post.comments.id(commentId);
    if (!comment) return res.status(404).json({ error: "Commentaire non trouvé" });

    if (!comment.reactions) comment.reactions = [];
    const existingReaction = comment.reactions.find(r => r.userId === userId);
    if (existingReaction) {
      existingReaction.types = type;
    } else {
      comment.reactions.push({ userId, types: type });
    }

    await post.save();
    res.json(comment.reactions);
  } catch (error) {
    res.status(500).json({ error: "Erreur lors de la réaction au commentaire" });
  }
};

exports.replyToComment = async (req, res) => {
  try {
    const { postId, commentId } = req.params;
    const { content, userId } = req.body;
    const post = await SocialPost.findById(postId);
    if (!post) return res.status(404).json({ error: "Post non trouvé" });
    const comment = post.comments.id(commentId);
    if (!comment) return res.status(404).json({ error: "Commentaire non trouvé" });

    comment.replies.push({
      userId,
      content,
      createdAt: new Date()
    });

    await post.save();
    res.json(comment.replies);
  } catch (error) {
    res.status(500).json({ error: "Erreur lors de la réponse au commentaire" });
  }
};

// Ajout d'une réaction à une réponse d'un commentaire
exports.addReplyReaction = async (req, res) => {
  try {
    const { postId, commentId, replyId } = req.params;
    const { type, userId } = req.body;
    const post = await SocialPost.findById(postId);
    if (!post) return res.status(404).json({ error: "Post non trouvé" });

    const comment = post.comments.id(commentId);
    if (!comment) return res.status(404).json({ error: "Commentaire non trouvé" });

    const reply = comment.replies.id(replyId);
    if (!reply) return res.status(404).json({ error: "Réponse non trouvée" });

    if (!reply.reactions) reply.reactions = [];
    const existingReaction = reply.reactions.find(r => r.userId === userId);
    if (existingReaction) {
      existingReaction.types = type;
    } else {
      reply.reactions.push({ userId,types: type });
    }

    await post.save();
    res.json(reply.reactions);
  } catch (error) {
    res.status(500).json({ error: "Erreur lors de la réaction à la réponse" });
  }
};


exports.updatePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const { content, isArticle, articleTitle, links = [] } = req.body;
    // Si tu utilises l’auth, prends userId du token
    // const { userId } = req.user;
    // Sinon, prends-le du body (pas recommandé pour la sécurité)
    const { idUser } = req.body;

    // Gère les fichiers uploadés
    let files = [];
    if (req.files && req.files.length > 0) {
      files = req.files.map(file => ({
        url: `/social/${file.filename}`,
        type: file.mimetype.split('/')[0] === 'image' ? 'image' :
              file.mimetype.split('/')[0] === 'video' ? 'video' : 'file'
      }));
    } else if (req.body.urlFile) {
      // Si urlFile est envoyé (ex: pour garder les anciens fichiers)
      files = req.body.urlFile.filter(Boolean).map(url => ({ url }));
    }

    const linksArray = typeof links === 'string' ? [links] : links;

    const updated = await SocialPost.findByIdAndUpdate(
      postId,
      {
        content,
        isArticle: !!isArticle,
        articleTitle,
        files,
        links: linksArray.filter(Boolean).map(url => ({ url }))
      },
      { new: true }
    );
    if (!updated) return res.status(404).json({ error: "Post non trouvé" });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: "Erreur lors de la modification du post", details: error.message });
  }
};

exports.deletePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const deleted = await SocialPost.findByIdAndDelete(postId);
    if (!deleted) return res.status(404).json({ error: "Post non trouvé" });
    res.json({ message: "Post supprimé avec succès" });
  } catch (error) {
    res.status(500).json({ error: "Erreur lors de la suppression du post", details: error.message });
  }
};
