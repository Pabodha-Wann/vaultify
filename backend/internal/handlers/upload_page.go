package handlers

import "net/http"

func UploadPage(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "text/html")
	w.Write([]byte(`
		<html>
		<body>
			<h2>Vaultify Test Upload</h2>
			<form action="/files" method="POST" enctype="multipart/form-data">
				<input type="file" name="file" required>
				<input type="text" name="folder_id" placeholder="folder id (optional)">
				<button type="submit">Upload</button>
			</form>
			<br>
			<a href="/files">View my files (JSON)</a>
			<br><br>
		</body>
		</html>
	`))
}
