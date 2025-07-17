import pandas as pd
import json

model_names = ['GPT4.1-mini', 'Gemma3-12B',  'QwenVL-2.5-7B', 'Phi-4-5.6B', 'Pixtral-12B', 'LLaMa3.2-11B']

file_name_correct = ['All_Analyser_gpt4.1-mini.xlsx', 'All_Analyser_Gemma3.xlsx', 'All_Analyser_Qwen2.5-VL.xlsx',
                     'All_Analyser_phi-4.xlsx', 'All_Analyser_pixtral.xlsx', 'All_Analyser_llama3.2.xlsx']

file_name_random = ['All_Analyser_gpt4.1-mini_random_artist.xlsx', 'All_Analyser_Gemma3_random_artist.xlsx',
                    'All_Analyser_Qwen2.5-VL_random_artist.xlsx', 'All_Analyser_phi-4_random_artist.xlsx',
                    'All_Analyser_pixtral_random_artist.xlsx', 'All_Analyser_llama3.2_random_artist.xlsx']

path_corrects = ['D:/AI_impostors/Results_stable_diffusion/Correct_painter_prompt/' + file for file in file_name_correct]
path_randoms = ['D:/AI_impostors/Results_stable_diffusion/Random_painter_prompt/' + file for file in file_name_random]


def format_text(text):
    if pd.isna(text):
        return ""
    words = text.replace('-', ' ').split()
    return ' '.join(
        w.lower() if w.lower() in ['the', 'and'] else w.capitalize()
        for w in words
    )


base_df = pd.read_excel(path_corrects[0])
data_dict = {}

for idx, row in base_df.iterrows():
    data_dict[idx] = {
        "generator": "Stable Diffusion-3.5",
        "image": f"https://raw.githubusercontent.com/aMa2210/WikiArt_VLM/main/images/Stable-Diffusion/{idx}.jpg",
        "artist": format_text(row['artist']),
        "genre": format_text(row['genre']),
        "style": format_text(row['style']),
        "prompt": "Correct Painter"
    }

for i, (path, model_name) in enumerate(zip(path_corrects, model_names), 1):
    df = pd.read_excel(path)
    for idx, row in df.iterrows():
        result = "wrong" if 'yes' in str(row['answer']).lower() else "correct"
        data_dict[idx][f"result{i}"] = result
        data_dict[idx][f"analyser{i}"] = model_name

all_items = list(data_dict.values())

with open('Stable-Diffusion_correct.json', 'w', encoding='utf-8') as f:
    json.dump(all_items, f, ensure_ascii=False, indent=2)


#########################################################################################
base_df_random = pd.read_excel(path_randoms[0])
data_dict_random = {}

for idx, row in base_df_random.iterrows():
    data_dict_random[idx] = {
        "generator": "Stable Diffusion-3.5",
        "image": f"https://raw.githubusercontent.com/aMa2210/WikiArt_VLM/main/images/Stable-Diffusion/{idx}.jpg",
        "artist": format_text(row['artist']),
        "genre": format_text(row['genre']),
        "style": format_text(row['style']),
        "prompt": "Incorrect Painter"
    }

for i, (path, model_name) in enumerate(zip(path_randoms, model_names), 1):
    df = pd.read_excel(path)
    for idx, row in df.iterrows():
        result = "wrong" if 'yes' in str(row['answer']).lower() else "correct"
        data_dict_random[idx][f"result{i}"] = result
        data_dict_random[idx][f"analyser{i}"] = model_name

all_items_random = list(data_dict_random.values())

with open('Stable-Diffusion_random.json', 'w', encoding='utf-8') as f:
    json.dump(all_items_random, f, ensure_ascii=False, indent=2)
