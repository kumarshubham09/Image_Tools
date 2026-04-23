import customtkinter as ctk
from tkinter import filedialog, messagebox
from PIL import Image
import vtracer
import os

# Set the theme and appearance
ctk.set_appearance_mode("System")  # Modes: "System" (standard), "Dark", "Light"
ctk.set_default_color_theme("blue")  # Themes: "blue" (standard), "green", "dark-blue"

class ModernImageConverter(ctk.CTk):
    def __init__(self):
        super().__init__()

        # Window config
        self.title("Image to WebP / SVG Converter")
        self.geometry("500x350")
        self.resizable(False, False)

        # Variables
        self.input_path = ctk.StringVar()
        self.output_format = ctk.StringVar(value="webp")

        self.setup_ui()

    def setup_ui(self):
        # --- Title Section ---
        self.title_label = ctk.CTkLabel(
            self, 
            text="Pixel & Vector Converter", 
            font=ctk.CTkFont(size=20, weight="bold")
        )
        self.title_label.pack(pady=(20, 5))

        self.subtitle_label = ctk.CTkLabel(
            self, 
            text="Convert PNG/JPG to WebP or SVG", 
            font=ctk.CTkFont(size=12),
            text_color="gray"
        )
        self.subtitle_label.pack(pady=(0, 20))

        # --- File Selection Frame ---
        self.file_frame = ctk.CTkFrame(self, fg_color="transparent")
        self.file_frame.pack(padx=20, fill="x")

        self.file_entry = ctk.CTkEntry(
            self.file_frame, 
            textvariable=self.input_path, 
            placeholder_text="Choose an image...",
            state="readonly",
            width=320
        )
        self.file_entry.pack(side="left", padx=(0, 10))

        self.browse_btn = ctk.CTkButton(
            self.file_frame, 
            text="Browse File", 
            command=self.browse_file,
            width=100
        )
        self.browse_btn.pack(side="left")

        # --- Format Selection Frame ---
        self.format_frame = ctk.CTkFrame(self)
        self.format_frame.pack(pady=25, padx=20, fill="x")

        self.format_label = ctk.CTkLabel(
            self.format_frame, 
            text="Select Target Format:", 
            font=ctk.CTkFont(weight="bold")
        )
        self.format_label.pack(pady=(10, 5))

        self.radio_frame = ctk.CTkFrame(self.format_frame, fg_color="transparent")
        self.radio_frame.pack(pady=(0, 10))

        self.radio_webp = ctk.CTkRadioButton(
            self.radio_frame, 
            text="WebP (Raster)", 
            variable=self.output_format, 
            value="webp"
        )
        self.radio_webp.pack(side="left", padx=20)

        self.radio_svg = ctk.CTkRadioButton(
            self.radio_frame, 
            text="SVG (Vector Traced)", 
            variable=self.output_format, 
            value="svg"
        )
        self.radio_svg.pack(side="left", padx=20)

        # --- Action Button ---
        self.convert_btn = ctk.CTkButton(
            self, 
            text="Convert Image", 
            command=self.convert_image,
            font=ctk.CTkFont(size=15, weight="bold"),
            height=40,
            fg_color="#10b981", # Modern green
            hover_color="#059669"
        )
        self.convert_btn.pack(pady=10)

    def browse_file(self):
        file_path = filedialog.askopenfilename(
            title="Select an Image",
            filetypes=[("Image Files", "*.png *.jpg *.jpeg")]
        )
        if file_path:
            self.input_path.set(file_path)
            # Re-enable entry briefly to update text, then set back to readonly
            self.file_entry.configure(state="normal")
            self.file_entry.delete(0, 'end')
            self.file_entry.insert(0, file_path)
            self.file_entry.configure(state="readonly")

    def convert_image(self):
        input_file = self.input_path.get()
        if not input_file:
            messagebox.showwarning("Warning", "Please browse and select an image file first.")
            return

        target_format = self.output_format.get()
        file_name, _ = os.path.splitext(input_file)
        output_file = f"{file_name}.{target_format}"

        # Change button text to show it's working
        self.convert_btn.configure(text="Processing...", state="disabled")
        self.update()

        try:
            if target_format == "webp":
                self.convert_to_webp(input_file, output_file)
            elif target_format == "svg":
                self.convert_to_svg(input_file, output_file)
            
            messagebox.showinfo("Success", f"Conversion Complete!\nSaved to:\n{output_file}")
            
        except Exception as e:
            messagebox.showerror("Error", f"An error occurred during conversion:\n{str(e)}")
        finally:
            # Reset button state
            self.convert_btn.configure(text="Convert Image", state="normal")

    def convert_to_webp(self, input_path, output_path):
        with Image.open(input_path) as img:
            img.save(output_path, "webp", quality=85)

    def convert_to_svg(self, input_path, output_path):
        vtracer.convert_image_to_svg_py(
            input_path,
            output_path,
            colormode='color',
            hierarchical='stacked', 
            mode='spline',
            filter_speckle=4,
            color_precision=6,
            layer_difference=16,
            corner_threshold=60,  
            length_threshold=4.0, 
            max_iterations=10,    
            splice_threshold=45,  
            path_precision=8      
        )

if __name__ == "__main__":
    app = ModernImageConverter()
    app.mainloop()